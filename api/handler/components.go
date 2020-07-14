package handler

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/kalm-staging/kalm/api/resources"
	"github.com/kalm-staging/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes"
)

func (h *ApiHandler) handleListComponents(c echo.Context) error {
	componentList, err := getComponentList(c)

	if err != nil {
		return err
	}

	res, err := h.componentListResponse(c, componentList)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleCreateComponent(c echo.Context) error {
	component, err := createComponent(c)

	if err != nil {
		return err
	}

	res, err := h.componentResponse(c, component)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, res)
}

func (h *ApiHandler) handleUpdateComponent(c echo.Context) error {
	component, err := updateComponent(c)

	if err != nil {
		return err
	}

	res, err := h.componentResponse(c, component)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, res)
}

func (h *ApiHandler) handleGetComponent(c echo.Context) error {
	component, err := getComponent(c)

	if err != nil {
		return err
	}

	res, err := h.componentResponse(c, component)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleDeleteComponent(c echo.Context) error {
	err := deleteComponent(c)
	if err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

// helper

func deleteComponent(c echo.Context) error {
	k8sClient := getK8sClient(c)
	_, err := k8sClient.RESTClient().Delete().Body(c.Request().Body).AbsPath("/apis/core.kalm.dev/v1alpha1/namespaces/" + c.Param("applicationName") + "/components/" + c.Param("name")).DoRaw()
	return err
}

func GetComponent(k8sClient *kubernetes.Clientset, applicationName, componentName string) (*v1alpha1.Component, error) {
	var fetched v1alpha1.Component
	err := k8sClient.RESTClient().Get().AbsPath("/apis/core.kalm.dev/v1alpha1/namespaces/" + applicationName + "/components/" + componentName).Do().Into(&fetched)
	if err != nil {
		return nil, err
	}
	return &fetched, nil
}

func getComponent(c echo.Context) (*v1alpha1.Component, error) {
	k8sClient := getK8sClient(c)
	return GetComponent(k8sClient, c.Param("applicationName"), c.Param("name"))
}

func getComponentList(c echo.Context) (*v1alpha1.ComponentList, error) {
	k8sClient := getK8sClient(c)
	var fetched v1alpha1.ComponentList
	err := k8sClient.RESTClient().Get().AbsPath("/apis/core.kalm.dev/v1alpha1/namespaces/" + c.Param("applicationName") + "/components").Do().Into(&fetched)
	if err != nil {
		return nil, err
	}
	return &fetched, nil
}

func createComponent(c echo.Context) (*v1alpha1.Component, error) {
	k8sClient := getK8sClient(c)

	crdComponent, plugins, err := getComponentFromContext(c)
	if err != nil {
		return nil, err
	}

	// TODO validate component
	//if err := v1alpha1.TryValidateApplicationFromAPI(crdComponent.Spec, crdComponent.Name); err != nil {
	//	return nil, err
	//}

	bts, _ := json.Marshal(crdComponent)
	var component v1alpha1.Component
	err = k8sClient.RESTClient().Post().Body(bts).AbsPath("/apis/core.kalm.dev/v1alpha1/namespaces/" + c.Param("applicationName") + "/components").Do().Into(&component)
	if err != nil {
		return nil, err
	}

	kalmClient, _ := getKalmV1Alpha1Client(c)
	err = resources.UpdateComponentPluginBindingsForObject(kalmClient, component.Namespace, component.Name, plugins)

	if err != nil {
		return nil, err
	}
	return &component, nil
}

func updateComponent(c echo.Context) (*v1alpha1.Component, error) {
	k8sClient := getK8sClient(c)

	crdComponent, plugins, err := getComponentFromContext(c)

	if err != nil {
		return nil, err
	}

	fetched, err := getComponent(c)

	if err != nil {
		return nil, err
	}
	crdComponent.ResourceVersion = fetched.ResourceVersion

	bts, _ := json.Marshal(crdComponent)
	var component v1alpha1.Component
	err = k8sClient.RESTClient().Put().Body(bts).AbsPath("/apis/core.kalm.dev/v1alpha1/namespaces/" + c.Param("applicationName") + "/components/" + c.Param("name")).Do().Into(&component)

	if err != nil {
		return nil, err
	}

	kalmClient, _ := getKalmV1Alpha1Client(c)
	err = resources.UpdateComponentPluginBindingsForObject(kalmClient, component.Namespace, component.Name, plugins)

	if err != nil {
		return nil, err
	}
	return &component, nil
}

func getComponentFromContext(c echo.Context) (*v1alpha1.Component, []runtime.RawExtension, error) {
	var component resources.Component

	if err := c.Bind(&component); err != nil {
		return nil, nil, err
	}

	name := c.Param("name")

	if name == "" {
		name = component.Name
	}

	crdComponent := &v1alpha1.Component{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "Component",
			APIVersion: "core.kalm.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Name:      name,
			Namespace: c.Param("applicationName"),
		},
		Spec: component.ComponentSpec,
	}

	// for pvc volumes, check if pvcName is set
	for i, vol := range crdComponent.Spec.Volumes {
		if vol.Type != v1alpha1.VolumeTypePersistentVolumeClaim {
			continue
		}

		if vol.PVC == "" {
			genPVCName := fmt.Sprintf("pvc-%s-%d-%d", crdComponent.Name, time.Now().Unix(), rand.Intn(10000))
			vol.PVC = genPVCName
		}

		crdComponent.Spec.Volumes[i] = vol
	}

	return crdComponent, component.Plugins, nil
}

func (h *ApiHandler) componentResponse(c echo.Context, component *v1alpha1.Component) (*resources.ComponentDetails, error) {
	k8sClient := getK8sClient(c)
	k8sClientConfig := getK8sClientConfig(c)
	builder := resources.NewBuilder(k8sClient, k8sClientConfig, h.logger)
	return builder.BuildComponentDetails(component, nil)
}

func (h *ApiHandler) componentListResponse(c echo.Context, componentList *v1alpha1.ComponentList) ([]resources.ComponentDetails, error) {
	k8sClient := getK8sClient(c)
	k8sClientConfig := getK8sClientConfig(c)
	builder := resources.NewBuilder(k8sClient, k8sClientConfig, h.logger)
	return builder.BuildComponentDetailsResponse(componentList)
}
