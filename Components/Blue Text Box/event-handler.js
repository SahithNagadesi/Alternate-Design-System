/**
 * Event handler utility for Pega DX API actions.
 *
 * Dispatches property updates and blur events to the Pega case store
 * so that the case data stays in sync with the UI.
 *
 * @param {Object} actions  - Pega actions API from pConn.getActionsApi()
 * @param {string} eventType - "change" | "blur" | "changeNblur"
 * @param {string} propName  - Property reference (e.g. ".FirstName")
 * @param {*}      value     - The new value to persist
 */
export default function handleEvent(actions, eventType, propName, value) {
  if (!actions || !propName) {
    console.warn(
      "BlueTextBox handleEvent: Missing actions API or property name. " +
        "Ensure getPConnect() is available."
    );
    return;
  }

  switch (eventType) {
    case "change":
      // Update field value in the Pega store (no validation trigger)
      actions.updateFieldValue(propName, value);
      break;

    case "blur":
      // Trigger field-level validation without updating value
      actions.triggerFieldChange(propName, value);
      break;

    case "changeNblur":
      // Update value AND trigger validation — typical on-blur pattern
      actions.updateFieldValue(propName, value);
      actions.triggerFieldChange(propName, value);
      break;

    default:
      console.warn(
        `BlueTextBox handleEvent: Unknown event type "${eventType}". ` +
          `Expected "change", "blur", or "changeNblur".`
      );
      break;
  }
}
