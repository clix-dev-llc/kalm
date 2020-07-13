import React from "react";
import { storiesOf } from "@storybook/react";
import { RenderHttpRouteDestinations } from "forms/Route/destinations";
import { FieldArray, arrayPush, formValueSelector, reduxForm, Field } from "redux-form";
import { KPanel } from "widgets/KPanel";
import { connect } from "react-redux";
import { Box, Button, Collapse, Icon, Typography } from "@material-ui/core";
import { Alert, AlertTitle } from "@material-ui/lab";
import { Caption } from "widgets/Label";
import Immutable from "immutable";
import { withStyles } from "@material-ui/core/styles";
import { withProvider, store, resetStore } from "_stories/ReduxConfig";
import { ValidatorAtLeastOneHttpRouteDestination } from "forms/validator";
import { ROUTE_FORM_ID } from "forms/formIDs";
import { HttpRouteDestination, HttpRouteForm } from "types/route";
import { Service } from "types/service";
import { text, number, date } from "@storybook/addon-knobs";
import {
  createRoute,
  createApplication,
  createApplicationComponent,
  generateRandomIntList,
  mergeMetrics,
  createRoutes,
} from "_stories/data/application";
import {
  ApplicationDetails,
  ApplicationComponentDetails,
  LOAD_APPLICATIONS_FULFILLED,
  LOAD_APPLICATIONS_PENDING,
  LOAD_ALL_NAMESAPCES_COMPONETS,
} from "types/application";
import { SET_CURRENT_NAMESPACE } from "types/namespace";
import { formValidateOrNotBlockByTutorial } from "tutorials/utils";
import { KAutoCompleteSingleValue, KAutoCompleteOption } from "forms/Basic/autoComplete";
import { createServices } from "_stories/data/service";
import withReduxForm from "_stories/ReduxFormConfig";

storiesOf("Widgets/HttpRouteDestinations", module)
  //   .addDecorator(withProvider)
  .addDecorator(withReduxForm)
  .add("Has data", () => {
    resetStore();

    const appName = text("applicationName", "kalm-bookinfo", "Application1");
    const componentCounter = number("pod counter", 5, undefined, "Application1");
    const podCounter = number("pod counter", 5, undefined, "Application1");
    const createTime = date("create Date", new Date("2020-06-11"), "Application1");

    createRoutes(store, [appName]);

    let oneApp: ApplicationDetails = createApplication(appName);

    const allComponents: Immutable.Map<
      string,
      Immutable.List<ApplicationComponentDetails>
    > = createApplicationComponent(appName, componentCounter, createTime, generateRandomIntList(podCounter, 0, 5));

    oneApp = mergeMetrics(oneApp, allComponents);

    const applications: Immutable.List<ApplicationDetails> = Immutable.List<ApplicationDetails>([oneApp]);
    store.dispatch({ type: LOAD_APPLICATIONS_PENDING });
    store.dispatch({
      type: LOAD_ALL_NAMESAPCES_COMPONETS,
      payload: {
        components: allComponents,
      },
    });
    store.dispatch({ type: LOAD_APPLICATIONS_FULFILLED, payload: { applicationList: applications } });
    store.dispatch({
      type: SET_CURRENT_NAMESPACE,
      payload: {
        namespace: appName,
      },
    });
    const options: KAutoCompleteOption[] = [];
    const services = createServices() as Immutable.List<Service>;
    const activeNamespace = "kalm-bookinfo";
    services
      .filter((x) => {
        const ns = x.get("namespace");

        // TODO should we ignore the system namespaces??
        return (
          ns !== "kalm-system" &&
          ns !== "kapp-system" &&
          ns !== "kube-system" &&
          ns !== "istio-system" &&
          ns !== "cert-manager" &&
          ns !== "istio-operator"
        );
      })
      .sort((a, b): number => {
        const aNamespace = a.get("namespace");
        if (aNamespace === activeNamespace) {
          return -1;
        }

        const bNamespace = b.get("namespace");
        if (bNamespace === activeNamespace) {
          return 1;
        }

        if (aNamespace === bNamespace) {
          return a.get("name").localeCompare(b.get("name"));
        } else {
          return aNamespace.localeCompare(bNamespace);
        }
      })
      .forEach((svc) => {
        svc
          .get("ports")
          .filter((p) => p.get("protocol") === "TCP")
          .forEach((port) => {
            options.push({
              value: `${svc.get("name")}.${svc.get("namespace")}.svc.cluster.local:${port.get("port")}`,
              label: svc.get("name") + ":" + port.get("port"),
              group:
                svc.get("namespace") === activeNamespace ? `${svc.get("namespace")} (Current)` : svc.get("namespace"),
            });
          });
      });
    return (
      <Field
        name={"name"}
        component={KAutoCompleteSingleValue}
        label="Choose a target"
        // validate={[ValidatorRequired]}
        options={options}
        noOptionsText={
          <Alert severity="warning">
            <AlertTitle>No valid targets found.</AlertTitle>
            <Typography>
              If you can't find the target you want, please check if you have configured ports on the component. Only
              components that have ports will appear in the options.
            </Typography>
          </Alert>
        }
      />
    );
  });