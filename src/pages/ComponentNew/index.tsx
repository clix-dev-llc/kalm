import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions, ComponentFormValues } from "../../actions";
import { createComponentAction } from "../../actions/component";
import ComponentForm from "../../forms/Component";
import { RootState } from "../../reducers";
import { BasePage } from "../BasePage";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
    }
  });

interface Props extends WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class ComponentNew extends React.PureComponent<Props> {
  private submit = async (componentFormValues: ComponentFormValues) => {
    const { dispatch } = this.props;
    await dispatch(createComponentAction(componentFormValues));
    await dispatch(push("/components"));
  };

  public render() {
    const { classes } = this.props;
    return (
      <BasePage title="New Component">
        <div className={classes.root}>
          <ComponentForm onSubmit={this.submit} />
        </div>
      </BasePage>
    );
  }
}

export default withStyles(styles)(connect()(ComponentNew));
