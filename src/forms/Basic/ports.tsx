import { Button, Divider, Grid, IconButton, MenuItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import DeleteIcon from "@material-ui/icons/Delete";
import React from "react";
import {
  Field,
  FieldArray,
  WrappedFieldArrayProps,
  WrappedFieldProps
} from "redux-form";
import { RenderSelectField, renderTextField } from ".";
import { NormalizePort } from "../normalizer";
import { ValidatorRequired } from "../validator";

export const portTypeTCP = "TCP";
export const portTypeUDP = "UDP";

const generateNewPort = () => ({
  name: "",
  protocol: portTypeTCP,
  containerPort: "",
  servicePort: ""
});

const renderPorts = ({
  fields,
  meta: { error, submitFailed }
}: WrappedFieldArrayProps<{}>) => {
  const classes = makeStyles(theme => ({
    delete: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    field: {
      margin: 0
    },
    divider: {
      marginBottom: theme.spacing(3)
    }
  }))();

  return (
    <div>
      <div>{submitFailed && error && <span>{error}</span>}</div>
      {fields.map((port, index) => (
        <div key={index}>
          <Grid container spacing={2} className={classes.divider}>
            <Grid item xs={10}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Field
                    classes={{ root: classes.field }}
                    name={`${port}.name`}
                    validate={[ValidatorRequired]}
                    autoFocus
                    component={renderTextField}
                    label="Port Name"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Field
                    classes={{ root: classes.field }}
                    name={`${port}.protocol`}
                    validate={[ValidatorRequired]}
                    component={RenderSelectField}
                    label="Protocol"
                  >
                    <MenuItem value={portTypeTCP}>TCP</MenuItem>
                    <MenuItem value={portTypeUDP}>UDP</MenuItem>
                  </Field>
                </Grid>
                <Grid item xs={6}>
                  <Field
                    classes={{ root: classes.field }}
                    name={`${port}.containerPort`}
                    type="number"
                    validate={[ValidatorRequired]}
                    component={renderTextField}
                    normalize={NormalizePort}
                    label="Conpoment Port"
                    placeholder="8080"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Field
                    classes={{ root: classes.field }}
                    name={`${port}.servicePort`}
                    normalize={NormalizePort}
                    validate={[ValidatorRequired]}
                    type="number"
                    component={renderTextField}
                    label="Service Port"
                    placeholder="80"
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={2} className={classes.delete}>
              <IconButton
                aria-label="delete"
                onClick={() => fields.remove(index)}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
          {index !== fields.length - 1 ? (
            <Divider classes={{ root: classes.divider }} />
          ) : null}
        </div>
      ))}
      <Button
        variant="outlined"
        color="primary"
        size="small"
        onClick={() => fields.push(generateNewPort())}
      >
        Add Port
      </Button>
    </div>
  );
};

export const renderEnv = ({
  label,
  input,
  placeholder,
  helperText,
  meta: { touched, invalid, error },
  ...custom
}: FilledTextFieldProps & WrappedFieldProps & Props) => (
  <TextField
    label={label}
    error={touched && invalid}
    helperText={(touched && error) || helperText}
    placeholder={placeholder}
    fullWidth
    margin="normal"
    variant="filled"
    {...input}
    {...custom}
  />
);

interface Props {
  label?: string;
  helperText?: string;
  placeholder?: string;
}

export const CustomPorts = (props: WrappedFieldArrayProps<{}> | {}) => {
  return (
    <FieldArray {...props} name="ports" valid={true} component={renderPorts} />
  );
};
