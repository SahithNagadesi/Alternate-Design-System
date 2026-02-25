/**
 * YellowButton – Pega Constellation DX Component
 *
 * A yellow "Proceed" action button built for Pega Constellation.
 * Integrates with the Pega DX Component SDK via getPConnect().
 *
 * Registered component type: "YellowButton"
 * Subtype: Field
 */

import { withConfiguration } from "@pega/cosmos-react-core";
import type { PConnProps } from "@pega/pcore-pconnect-typedefs";
import YellowButton from "./YellowButton";
import type { YellowButtonProps } from "./YellowButton";

// ── Pega bridge props coming from getPConnect() ──
interface YellowButtonPConnectProps extends PConnProps {
  label?: string;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  variant?: "primary" | "secondary";
  showIcon?: boolean;
  visibility?: boolean;
  actionID?: string;       // Pega action to fire
  actionParams?: object;   // Optional params for the action
}

/**
 * Bridge wrapper that reads Pega metadata from getPConnect()
 * and passes clean React props to the presentational <YellowButton>.
 */
function YellowButtonBridge(props: YellowButtonPConnectProps) {
  const {
    getPConnect,
    label = "Proceed",
    disabled = false,
    size = "medium",
    variant = "primary",
    showIcon = true,
    visibility = true,
    actionID,
    actionParams,
  } = props;

  // ── Visibility check ──
  if (!visibility) return null;

  const pConn = getPConnect();

  // Resolve any Pega property references in the props
  const resolvedLabel =
    (pConn.resolveConfigProps?.({ label })?.label as string) ?? label;
  const resolvedDisabled =
    (pConn.resolveConfigProps?.({ disabled })?.disabled as boolean) ?? disabled;

  // ── Click handler → fires a Pega action via the DX API ──
  const handleClick = () => {
    if (resolvedDisabled) return;

    if (actionID) {
      // Fire a configured Pega action (e.g. "finishAssignment", "navigateToStep")
      pConn.getActionsApi().action(actionID, actionParams ?? {});
    } else {
      // Default: finish the current assignment
      pConn.getActionsApi().finishAssignment();
    }
  };

  // ── Map bridge props → presentational props ──
  const viewProps: YellowButtonProps = {
    label: resolvedLabel,
    disabled: resolvedDisabled,
    size,
    variant,
    showIcon,
    onClick: handleClick,
    testId: pConn.getComponentName?.() ?? "yellow-button",
  };

  return <YellowButton {...viewProps} />;
}

// Register the component with Pega Constellation's runtime
export default withConfiguration(YellowButtonBridge);
