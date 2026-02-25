/**
 * Event handler utility for Pega DX API actions.
 * Dispatches property updates and blur events to the Pega store.
 *
 * @param {Object} actions - Pega actions API from pConn.getActionsApi()
 * @param {string} eventType - Type of event: "change", "blur", or "changeNblur"
 * @param {string} propName - The property reference (e.g., ".FirstName")
 * @param {*} value - The new value to set
 */
export default function handleEvent(actions, eventType, propName, value) {
  if (!actions || !propName) {
    console.warn("BlueTextBox: Missing actions or propName in handleEvent.");
    return;
  }

  switch (eventType) {
    case "change":
      actions.updateFieldValue(propName, value);
      break;

    case "blur":
      actions.triggerFieldChange(propName, value);
      break;

    case "changeNblur":
      // Update value and trigger validation on blur
      actions.updateFieldValue(propName, value);
      actions.triggerFieldChange(propName, value);
      break;

    default:
      console.warn(`BlueTextBox: Unknown event type "${eventType}".`);
      break;
  }
}
