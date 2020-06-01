import { Grid, MenuItem } from "@material-ui/core";
import React from "react";
import { WrappedFieldArrayProps } from "redux-form";
import { Field } from "redux-form/immutable";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { HttpRouteCondition } from "../../types/route";
import { RenderSelectField } from "../Basic/select";
import { KRenderTextField } from "../Basic/textfield";
import { ValidatorRequired } from "../validator";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface Props extends WrappedFieldArrayProps<HttpRouteCondition>, FieldArrayComponentHackType {}

export class RenderHttpRouteConditions extends React.PureComponent<Props> {
  public render() {
    const { fields } = this.props;

    return fields.map((member, index) => {
      const rule = fields.get(index);
      return (
        <Grid container spacing={1} key={index} alignItems="center">
          <Grid item md={2}>
            {rule.get("type")} Rule
          </Grid>
          <Grid item md={2}>
            <Field name={`${member}.name`} component={KRenderTextField} label="Name" validate={[ValidatorRequired]} />
          </Grid>
          <Grid item md={2}>
            <Field
              name={`${member}.operator`}
              component={RenderSelectField}
              label="operator"
              validate={[ValidatorRequired]}>
              <MenuItem value={"equal"}>{"Equal"}</MenuItem>
              <MenuItem value={"withPrifix"}>{"With Prifix"}</MenuItem>
              <MenuItem value={"matchRegexp"}>{"Match Regexp"}</MenuItem>
            </Field>
          </Grid>
          <Grid item md={2}>
            <Field name={`${member}.value`} component={KRenderTextField} label="Value" validate={[ValidatorRequired]} />
          </Grid>
          <Grid item md={2}>
            <IconButtonWithTooltip
              tooltipPlacement="top"
              tooltipTitle="Delete"
              aria-label="delete"
              onClick={() => fields.remove(index)}>
              <DeleteIcon />
            </IconButtonWithTooltip>
          </Grid>
        </Grid>
      );
    });
  }
}