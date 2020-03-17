import axios from "axios";
import { ComponentTemplate, Application, ConfigFile } from ".";
import { convertFromCRDComponentTemplate } from "../convertors/ComponentTemplate";
import { V1alpha1ComponentTemplate } from "../kappModel/v1alpha1ComponentTemplate";
import { V1NodeList, V1PersistentVolumeList } from "../model/models";
import { ItemList } from "../kappModel/List";
import { V1alpha1Application, V1alpha1Dependency, V1alpha1File } from "../kappModel";
import { convertFromCRDApplication } from "../convertors/Application";
import { convertFromCRDDependency } from "../convertors/Dependency";
import { convertFromCRDFile } from "../convertors/File";

export const K8sApiPerfix = process.env.REACT_APP_K8S_API_PERFIX || "http://localhost:3001";

const getAxiosClient = () =>
  axios.create({
    timeout: 3000,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem("authorization_token")}`
    }
  });

export const getNodes = async () => {
  const res = await getAxiosClient().get<V1NodeList>(K8sApiPerfix + "/v1/nodes");
  return res.data.items;
};

export const getPersistentVolumes = async () => {
  const res = await getAxiosClient().get<V1PersistentVolumeList>(K8sApiPerfix + "/v1/persistentvolumes");
  return res.data.items;
};

export const getKappComponentTemplates = async () => {
  const res = await getAxiosClient().get<ItemList<V1alpha1ComponentTemplate>>(K8sApiPerfix + "/v1/componenttemplates");

  return res.data.items.map(convertFromCRDComponentTemplate);
};

export const updateKappComonentTemplate = async (component: V1alpha1ComponentTemplate): Promise<ComponentTemplate> => {
  const res = await getAxiosClient().put(
    K8sApiPerfix + `/v1/componenttemplates/${component.metadata!.name}`,
    component
  );

  return convertFromCRDComponentTemplate(res.data);
};

export const createKappComonentTemplate = async (component: V1alpha1ComponentTemplate): Promise<ComponentTemplate> => {
  const res = await getAxiosClient().post(K8sApiPerfix + `/v1/componenttemplates`, component);

  return convertFromCRDComponentTemplate(res.data);
};

export const deleteKappComonentTemplate = async (component: V1alpha1ComponentTemplate): Promise<void> => {
  await getAxiosClient().delete(K8sApiPerfix + `/v1/componenttemplates/${component.metadata!.name}`);

  // return convertFromCRDComponentTemplate(res.data);
};

export const getKappApplications = async () => {
  const res = await getAxiosClient().get<ItemList<V1alpha1Application>>(K8sApiPerfix + "/v1/applications");

  return res.data.items.map(convertFromCRDApplication);
};

export const updateKappApplication = async (application: V1alpha1Application): Promise<Application> => {
  const res = await getAxiosClient().put(
    K8sApiPerfix + `/v1/applications/${application.metadata!.namespace}/${application.metadata!.name}`,
    application
  );

  return convertFromCRDApplication(res.data);
};

export const getDependencies = async () => {
  const res = await getAxiosClient().get<ItemList<V1alpha1Dependency>>(K8sApiPerfix + "/v1/dependencies");
  return res.data.items.map(convertFromCRDDependency);
};

export const getKappFiles = async () => {
  const res = await getAxiosClient().get<ItemList<V1alpha1File>>(K8sApiPerfix + "/v1/files");

  return res.data.items.map(convertFromCRDFile);
};

export const createKappFile = async (file: V1alpha1File): Promise<ConfigFile> => {
  const res = await getAxiosClient().post(K8sApiPerfix + `/v1/files`, file);

  return convertFromCRDFile(res.data);
};

export const updateKappFile = async (file: V1alpha1File): Promise<ConfigFile> => {
  const res = await getAxiosClient().put(K8sApiPerfix + `/v1/files/${file.metadata!.name}`, file);

  return convertFromCRDFile(res.data);
};

export const deleteKappFile = async (file: V1alpha1File): Promise<void> => {
  await getAxiosClient().delete(K8sApiPerfix + `/v1/files/${file.metadata!.name}`);

  // return convertFromCRDFile(res.data);
};
