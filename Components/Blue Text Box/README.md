# 🔵 Blue Text Box — Custom Pega UI Component

A custom **Pega Constellation** text input field with a **vibrant blue background** and white text, built using React and styled-components.

---

## 📁 Project Structure

```
Components/Blue Text Box/
├── index.js                    # Entry point (withConfiguration HOC)
├── BlueTextBox.jsx             # Main component logic
├── styles.js                   # Styled-components (blue theme)
├── event-handler.js            # Pega DX API event utility
├── config.json                 # Pega component metadata & properties
├── __tests__/
│   └── BlueTextBox.test.jsx    # Unit tests (Jest + RTL)
└── README.md                   # This file
```

---

## ✨ Features

| Feature              | Description                                            |
|----------------------|--------------------------------------------------------|
| 🔵 Blue Background  | Vibrant blue (`#1A73E8`) input with white text         |
| ⌨️ Full Pega Binding | Syncs with Pega case data via DX API on blur           |
| 📖 Display Modes     | Supports `LABELS_LEFT` and `DISPLAY_ONLY` read modes   |
| ✅ Validation         | Inline error messages from Pega validate rules         |
| ♿ Accessible         | ARIA attributes, labels, focus management              |
| 🎨 Themed States     | Custom hover, focus, disabled, read-only, error styles |
| 🧪 Tested            | Comprehensive tests with Jest & React Testing Library  |

---

## 🎨 Visual Preview

| State       | Appearance                                      |
|-------------|--------------------------------------------------|
| **Default** | Blue (`#1A73E8`) background, white text          |
| **Focus**   | Darker blue (`#1558B0`) + blue glow ring         |
| **Hover**   | Slightly darker blue (`#1966D2`) + light border  |
| **Disabled**| Faded blue (`#A4C4F4`) + reduced opacity         |
| **Error**   | Blue background + red border + red glow ring     |

---

## 🚀 Usage in Pega

### 1. Build & Package
```bash
npm run build
```

### 2. Deploy to Pega
Upload the built component via **App Studio → Design System → Components**.

### 3. Configure in App Studio
- Drag the **Blue Text Box** field onto any form view
- Set the **property binding** (e.g., `.FirstName`)
- Configure label, placeholder, required, etc.
- The component automatically syncs values with the Pega case

---

## ⚙️ Component Properties

| Property         | Type    | Default          | Description                        |
|------------------|---------|------------------|------------------------------------|
| `label`          | TEXT    | "Blue Text Box"  | Field label text                   |
| `value`          | TEXT    | ""               | Bound Pega property value          |
| `placeholder`    | TEXT    | "Enter text..."  | Input placeholder text             |
| `helperText`     | TEXT    | ""               | Helper text displayed below input  |
| `validatemessage`| TEXT    | ""               | Error message from Pega validation |
| `required`       | BOOLEAN | false            | Mark the field as required         |
| `disabled`       | BOOLEAN | false            | Disable the input                  |
| `readOnly`       | BOOLEAN | false            | Make the input read-only           |
| `hideLabel`      | BOOLEAN | false            | Visually hide the label            |
| `testId`         | TEXT    | "blue-text-box"  | Test ID for automated testing      |

---

## 🎨 Customization

Edit **`styles.js`** to change colors or styling:

```js
// Primary blue background
background-color: #1a73e8 !important;

// Border
border: 2px solid #1558b0;

// Focus glow
box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.35);

// Placeholder text color
color: rgba(255, 255, 255, 0.6);
```

---

## 🔌 Pega DX API Integration

The component uses Pega's `actionsApi` to sync values:

```
User types → local state updates (responsive)
User blurs → actions.updateFieldValue()   → updates Pega store
           → actions.triggerFieldChange() → triggers validation
```

This follows the standard Pega Constellation pattern for custom field components.

---

## 🧪 Run Tests

```bash
npm test -- --testPathPattern="BlueTextBox"
```

### Test Coverage
- ✅ Renders label, placeholder, value
- ✅ Handles typing and blur events
- ✅ Calls Pega DX API actions correctly
- ✅ Supports custom onChange/onBlur callbacks
- ✅ Disabled and read-only states
- ✅ Validation error display
- ✅ DISPLAY_ONLY and LABELS_LEFT modes
- ✅ Fallback "---" for empty display values

---

Built with ❤️ for Pega Constellation
