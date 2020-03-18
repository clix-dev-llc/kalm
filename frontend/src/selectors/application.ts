import { getFormValues } from "redux-form/immutable";
import { Application } from "../actions";
import { EnvTypeExternal } from "../actions/";
import { store } from "../store";

export const getApplicationById = (applicationId: string): Application => {
  const state = store.getState();
  return state
    .get("applications")
    .get("applications")
    .get(applicationId) as Application;
};

export const duplicateApplication = (application: Application): Application => {
  const state = store.getState();
  const applications = state.get("applications").get("applications");

  let i = 0;
  let name = "";
  do {
    i += 1;
    name = `${application.get("name")}-duplicate-${i}`;
  } while (applications.find(x => x.get("name") === name));

  application = application.set("id", name);
  application = application.set("name", name);
  application = application.set("resourceVersion", undefined);

  return application;
};

export const getCurrentFormApplication = (): Application => {
  const state = store.getState();
  const application = getFormValues("application")(state) as Application;
  return application;
};

export const getApplicationSharedEnvNamesSet = (application: Application): Set<string> => {
  return new Set(
    application
      .get("sharedEnv")
      .map(x => x.get("name"))
      .toArray()
  );
};

export const getApplicationEnvStatus = (application: Application) => {
  const applicationSharedEnvNamesSet = getApplicationSharedEnvNamesSet(application);
  const applicationComponentExternalEnvsSet = new Set<string>();

  application.get("components").forEach((applicationComponent, index) => {
    applicationComponent
      .get("env")
      .filter(x => x.get("type") === EnvTypeExternal)
      .map(x => x.get("name"))
      .forEach(envName => {
        applicationComponentExternalEnvsSet.add(envName);
      });
  });

  const notUsedSharedEnvsSet = new Set(
    Array.from(applicationSharedEnvNamesSet).filter(x => !applicationComponentExternalEnvsSet.has(x))
  );

  const notDefinedSharedEnvsSet = new Set(
    Array.from(applicationComponentExternalEnvsSet).filter(x => !applicationSharedEnvNamesSet.has(x))
  );

  return {
    notUsedSharedEnvsSet,
    notDefinedSharedEnvsSet
  };
};