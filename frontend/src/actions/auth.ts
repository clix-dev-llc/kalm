import { api } from "api";
import { LoginStatus } from "types/authorization";
import { ThunkResult } from "types";
import {
  LOAD_LOGIN_STATUS_FAILED,
  LOAD_LOGIN_STATUS_FULFILLED,
  LOAD_LOGIN_STATUS_PENDING,
  LOGOUT,
  LogoutAction,
  SET_AUTH_TOKEN,
} from "types/common";
import { setErrorNotificationAction } from "./notification";
import { stopImpersonating } from "api/realApi";

export const loadLoginStatusAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    let loginStatus: LoginStatus;

    dispatch({ type: LOAD_LOGIN_STATUS_PENDING });
    try {
      loginStatus = await api.getLoginStatus();
      dispatch({
        type: LOAD_LOGIN_STATUS_FULFILLED,
        payload: { loginStatus },
      });
    } catch (e) {
      dispatch(setErrorNotificationAction(e.message));
      dispatch({ type: LOAD_LOGIN_STATUS_FAILED });
    }
  };
};

export const validateTokenAction = (token: string): ThunkResult<Promise<string>> => {
  return async (dispatch) => {
    try {
      await api.validateToken(token);

      dispatch({
        type: SET_AUTH_TOKEN,
        payload: { token },
      });

      dispatch(loadLoginStatusAction());

      return "";
    } catch (e) {
      dispatch(setErrorNotificationAction(e.message));
      return e.message;
    }
  };
};

export const logoutAction = (): LogoutAction => {
  stopImpersonating();
  return {
    type: LOGOUT,
  };
};
