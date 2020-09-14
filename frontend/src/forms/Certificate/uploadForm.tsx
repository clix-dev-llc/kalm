import { Button, Grid, Box } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { Field, Form, Formik, FormikProps } from "formik";
import { KFreeSoloFormikAutoCompleteMultiValues } from "forms/Basic/autoComplete";
import { KRenderDebounceFormikTextField } from "forms/Basic/textfield";
import { FormikUploader } from "forms/Basic/uploader";
import { ValidateHost } from "forms/validator";
import Immutable from "immutable";
import { extractDomainsFromCertificateContent } from "permission/utils";
import React from "react";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import sc from "../../utils/stringConstants";
import { CertificateIssuerList, selfManaged, CertificateFormTypeContent } from "types/certificate";
import DomainStatus from "widgets/DomainStatus";
import { connect } from "react-redux";
import { Prompt } from "widgets/Prompt";
import { Caption } from "widgets/Label";
import { Link } from "react-router-dom";
import { KPanel } from "widgets/KPanel";
import copy from "copy-to-clipboard";
import { setSuccessNotificationAction } from "actions/notification";

const mapStateToProps = (state: RootState, { form }: OwnProps) => {
  return {
    managedType: selfManaged as string,
    certificateIssuers: state.get("certificates").get("certificateIssuers") as CertificateIssuerList,
    ingressIP: state.get("cluster").get("info").get("ingressIP", "---.---.---.---"),
  };
};

interface OwnProps {
  form?: string;
  isEdit?: boolean;
  onSubmit: any;
  initialValues: CertificateFormTypeContent;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
    },
    fileInput: {},
    label: {
      fontSize: 12,
      marginBottom: 18,
      display: "block",
    },
    editBtn: {
      marginLeft: 8,
    },
  });

export interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  isEdit?: boolean;
  onSubmit: any;
  initialValues: CertificateFormTypeContent;
}

interface State {
  isEditCertificateIssuer: boolean;
}

class CertificateUploadFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isEditCertificateIssuer: false,
    };
  }

  private renderSelfManagedFields = (formikProps: FormikProps<CertificateFormTypeContent>) => {
    const { classes } = this.props;
    const { setFieldValue, values, errors, touched } = formikProps;
    return (
      <>
        <Grid item md={12}>
          <FormikUploader
            touched={touched.selfManagedCertContent}
            errorText={errors.selfManagedCertContent}
            inputlabel="Certificate file"
            inputid="upload-certificate"
            className={classes.fileInput}
            name="selfManagedCertContent"
            margin="normal"
            id="certificate-selfManagedCertContent"
            handleChange={(value: string) => {
              setFieldValue("selfManagedCertContent", value);
              const domains = extractDomainsFromCertificateContent(value);
              console.log("domains", domains);
              setFieldValue("domains", domains);
            }}
            multiline={true}
            rows={12}
            value={values.selfManagedCertContent}
          />
        </Grid>
        <Grid item md={12}>
          <FormikUploader
            touched={touched.selfManagedCertPrivateKey}
            errorText={errors.selfManagedCertPrivateKey}
            inputlabel="Private Key"
            inputid="upload-private-key"
            multiline={true}
            className={classes.fileInput}
            rows={12}
            id="certificate-selfManagedCertPrivateKey"
            name="selfManagedCertPrivateKey"
            margin="normal"
            handleChange={(value: string) => {
              setFieldValue("selfManagedCertPrivateKey", value);
            }}
            value={values.selfManagedCertPrivateKey}
          />
        </Grid>
      </>
    );
  };

  private validate = async (values: CertificateFormTypeContent) => {
    let errors: any = {};

    if (values.managedType === selfManaged && (!values.domains || values.domains.length < 1)) {
      errors.selfManagedCertContent = "Invalid Certificate";
      return errors;
    }

    errors.domains = values.domains.map(ValidateHost);
    if (errors.domains.filter((e: string | undefined) => e).length < 1) {
      delete errors.domains;
    }

    if (values.domains.length < 1) {
      errors.domains = "Required";
      return errors;
    }

    return errors;
  };

  public render() {
    const { onSubmit, initialValues, classes, isEdit, ingressIP, dispatch } = this.props;
    return (
      <Formik
        onSubmit={onSubmit}
        initialValues={initialValues}
        validate={this.validate}
        enableReinitialize={false}
        handleReset={console.log}
      >
        {(formikProps) => {
          const { values, dirty, touched, errors, setFieldValue, isSubmitting } = formikProps;
          const icons = Immutable.List(
            values.domains.map((domain, index) =>
              Array.isArray(errors.domains) && errors.domains[index] ? undefined : <DomainStatus domain={domain} />,
            ),
          );
          if (!dirty && values.selfManagedCertContent && values.domains.length <= 0) {
            const domains = extractDomainsFromCertificateContent(values.selfManagedCertContent);
            setFieldValue("domains", domains);
          }
          return (
            <Form className={classes.root} tutorial-anchor-id="certificate-form-upload">
              <Prompt when={dirty && !isSubmitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
              <KPanel
                content={
                  <Box p={2}>
                    <Grid container spacing={2}>
                      <Grid item md={12}>
                        <Field
                          component={KRenderDebounceFormikTextField}
                          label="Certificate name"
                          name="name"
                          disabled={isEdit}
                          placeholder="Please type a certificate name"
                          id="certificate-name"
                          helperText={!!errors.name && touched.name ? errors.name : " "}
                        />
                      </Grid>
                      <Grid item md={12}>
                        <Field
                          component={KFreeSoloFormikAutoCompleteMultiValues}
                          disabled={values.managedType === selfManaged}
                          name="domains"
                          icons={icons}
                          value={values.domains}
                          id="certificate-domains"
                          placeholder={
                            values.managedType === selfManaged
                              ? "Extract domains information when you upload a certificate file"
                              : "Please type domains"
                          }
                          helperText={
                            <Caption color="textSecondary">
                              Your cluster ip is{" "}
                              <Link
                                to="#"
                                onClick={() => {
                                  copy(ingressIP);
                                  dispatch(setSuccessNotificationAction("Copied successful!"));
                                }}
                              >
                                {ingressIP}
                              </Link>
                              . {sc.ROUTE_HOSTS_INPUT_HELPER}
                            </Caption>
                          }
                        />
                      </Grid>
                    </Grid>
                    {values.managedType === selfManaged ? this.renderSelfManagedFields(formikProps) : null}
                  </Box>
                }
              />
              <Box pt={2}>
                <Button id="save-certificate-button" type="submit" color="primary" variant="contained">
                  {isEdit ? "Update" : "Create"}
                </Button>
              </Box>
            </Form>
          );
        }}
      </Formik>
    );
  }
}

export const CertificateUploadForm = connect(mapStateToProps)(withStyles(styles)(CertificateUploadFormRaw));