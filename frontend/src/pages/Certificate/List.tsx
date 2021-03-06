import {
  Box,
  Button,
  createStyles,
  Link as KMLink,
  Theme,
  Typography,
  withStyles,
  WithStyles,
} from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import { deleteCertificateAction } from "actions/certificate";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Certificate } from "types/certificate";
import { formatDate } from "utils/date";
import sc from "utils/stringConstants";
import { PendingBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CustomizedButton } from "widgets/Button";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { EditIcon, KalmCertificatesIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";
import { Loading } from "widgets/Loading";
import { CertificateDataWrapper, WithCertificatesDataProps } from "./DataWrapper";
import { KLink } from "widgets/Link";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { ACMEServer } from "widgets/ACMEServer";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    normalStatus: {
      color: theme.palette.success.main,
    },
    warningStatus: {
      color: theme.palette.warning.main,
    },
    domainsColumn: {
      minWidth: 200,
    },
  });

const mapStateToProps = (state: RootState) => {
  return {
    isLoading: state.certificates.isLoading,
    isFirstLoaded: state.certificates.isFirstLoaded,
    certificates: state.certificates.certificates,
  };
};

interface Props
  extends WithCertificatesDataProps,
    WithUserAuthProps,
    WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp {}

interface State {
  isDeleteConfirmDialogOpen: boolean;
  deletingCertificate: Certificate | null;
}

class CertificateListPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isDeleteConfirmDialogOpen: false,
      deletingCertificate: null,
    };
  }

  private renderName = (cert: Certificate) => {
    return (
      <Typography variant={"subtitle2"}>
        <KLink to={`/certificates/${cert.name}`}>{cert.name}</KLink>
      </Typography>
    );
  };

  private renderDomains = (cert: Certificate) => {
    const { classes } = this.props;

    return (
      <Box className={classes.domainsColumn}>
        {cert.domains?.map((domain) => {
          return <FlexRowItemCenterBox key={domain}>{`${domain}`}</FlexRowItemCenterBox>;
        })}
      </Box>
    );
  };

  private renderActions = (cert: Certificate) => {
    const { canEditCluster } = this.props;
    return (
      <>
        {canEditCluster() && (
          <>
            {cert.isSelfManaged && (
              <IconLinkWithToolTip tooltipTitle="Edit" aria-label="edit" to={`/certificates/${cert.name}/edit`}>
                <EditIcon />
              </IconLinkWithToolTip>
            )}
            <DeleteButtonWithConfirmPopover
              popupId="delete-certificate-popup"
              popupTitle="DELETE CERTIFICATE?"
              confirmedAction={() => this.confirmDelete(cert)}
            />
          </>
        )}
      </>
    );
  };

  private closeDeleteConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
    });
  };

  private showDeleteConfirmDialog = (deletingCertificate: Certificate) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingCertificate,
    });
  };

  private confirmDelete = async (cert: Certificate) => {
    const { dispatch } = this.props;
    try {
      const certName = cert.name;
      await dispatch(deleteCertificateAction(certName));
      await dispatch(setSuccessNotificationAction(`Successfully deleted certificate '${certName}'`));
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderStatus = (cert: Certificate) => {
    const { classes } = this.props;
    const ready = cert.ready;

    if (ready === "True") {
      // why the ready field is a string value ?????
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox className={classes.normalStatus}>Normal</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else if (!!cert.reason) {
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox mr={1}>
            <PendingBadge />
          </FlexRowItemCenterBox>
          <FlexRowItemCenterBox className={classes.warningStatus}>{cert.reason}</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else {
      return <PendingBadge />;
    }
  };

  private renderType = (cert: Certificate) => {
    return cert.isSelfManaged ? "Uploaded" : "Let's Encrypt";
  };

  private renderIsSignedByTrustedCA = (cert: Certificate) => {
    return cert.isSignedByTrustedCA ? "Yes" : "No";
  };

  private renderExpireTimestamp = (cert: Certificate) => {
    return cert.expireTimestamp ? formatDate(new Date(cert.expireTimestamp! * 1000)) : "-";
  };

  private getKRTableColumns() {
    const { canEditCluster } = this.props;

    const columns = [
      {
        Header: "Cert Name",
        accessor: "name",
      },
      {
        Header: "Domains",
        accessor: "domains",
      },
      {
        Header: "Status",
        accessor: "status",
      },
      {
        Header: "Type",
        accessor: "isSelfManaged",
      },
      {
        Header: "Signed by Trusted CA",
        accessor: "isSignedByTrustedCA",
      },
      {
        Header: "Expiration Time",
        accessor: "expireTimestamp",
      },
    ];

    if (canEditCluster()) {
      columns.push({
        Header: "Actions",
        accessor: "actions",
      });
    }

    return columns;
  }

  private getKRTableData() {
    const { certificates } = this.props;
    const data: any[] = [];

    certificates.forEach((cert, index) => {
      data.push({
        name: this.renderName(cert),
        domains: this.renderDomains(cert),
        status: this.renderStatus(cert),
        isSelfManaged: this.renderType(cert),
        isSignedByTrustedCA: this.renderIsSignedByTrustedCA(cert),
        expireTimestamp: this.renderExpireTimestamp(cert),
        actions: this.renderActions(cert),
      });
    });

    return data;
  }

  private renderKRTable() {
    return (
      <KRTable showTitle={true} title="Certificates" columns={this.getKRTableColumns()} data={this.getKRTableData()} />
    );
  }

  private renderEmpty() {
    const { canEditCluster } = this.props;
    return (
      <EmptyInfoBox
        image={<KalmCertificatesIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={sc.EMPTY_CERT_TITLE}
        content={sc.EMPTY_CERT_SUBTITLE}
        button={
          canEditCluster() ? (
            <CustomizedButton variant="contained" color="primary" component={Link} to="/certificates/new">
              New Certificate
            </CustomizedButton>
          ) : null
        }
      />
    );
  }

  private renderInfoBox() {
    const title = "Certificates";

    const options = [
      {
        title: (
          <KMLink href="https://kalm.dev/docs/certs" target="_blank">
            Certificate Docs
          </KMLink>
        ),
        content: "",
      },
      {
        title: (
          <KMLink href="https://kalm.dev/docs/certs" target="_blank">
            What's an ACME DNS server?(TODO)
          </KMLink>
        ),
        draft: true,

        content: "",
      },
      {
        title: (
          <KMLink href="https://kalm.dev/docs/certs" target="_blank">
            HttpCert CRD
          </KMLink>
        ),
        draft: true,
        content: "",
      },
    ];

    return <InfoBox title={title} options={options} />;
  }

  public render() {
    const { isFirstLoaded, isLoading, certificates, canEditCluster } = this.props;
    return (
      <BasePage
        secondHeaderRight={
          canEditCluster() ? (
            <>
              {/* <H6>Certificates</H6> */}
              <Button
                color="primary"
                variant="outlined"
                size="small"
                component={Link}
                tutorial-anchor-id="add-certificate"
                to="/certificates/new"
              >
                New Certificate
              </Button>
              <Button
                color="primary"
                variant="outlined"
                size="small"
                component={Link}
                tutorial-anchor-id="upload-certificate"
                to="/certificates/upload"
              >
                Upload Certificate
              </Button>
            </>
          ) : null
        }
      >
        <Box p={2}>
          <ACMEServer />
          <Box mt={2}>
            {isLoading && !isFirstLoaded ? (
              <Loading />
            ) : certificates && certificates.length > 0 ? (
              this.renderKRTable()
            ) : (
              this.renderEmpty()
            )}
          </Box>
          <Box mt={2}>{this.renderInfoBox()}</Box>
        </Box>
      </BasePage>
    );
  }
}

export const CertificateListPage = withUserAuth(
  withStyles(styles)(connect(mapStateToProps)(CertificateDataWrapper(CertificateListPageRaw))),
);
