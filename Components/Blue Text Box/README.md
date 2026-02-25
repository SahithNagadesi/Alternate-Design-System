# 🔵 Blue Text Box — Custom Pega UI Component

A custom **Pega Constellation** text input field with a **blue background**, built using React and styled-components.

---

## 📁 Project Structure

```
Components/Blue Text Box/
├── index.js                # Entry point (withConfiguration HOC)
├── BlueTextBox.jsx         # Main component logic
├── styles.js               # Styled-components (blue theme)
├── event-handler.js        # Pega DX API event utility
├── config.json             # Pega component configuration
├── __tests__/
│   └── BlueTextBox.test.jsx  # Unit tests
└── README.md               # Documentation
```

## ✨ Features

| Feature              | Description                                           |
|----------------------|-------------------------------------------------------|
| 🔵 Blue Background  | Vibrant blue (`#1A73E8`) input with white text        |
| ⌨️ Full Pega Binding | Updates Pega case data via DX API on change & blur    |
| 📖 Display Modes     | Supports `LABELS_LEFT` and `DISPLAY_ONLY` read modes  |
| ✅ Validation         | Shows inline error messages from Pega validation      |
| ♿ Accessible         | Proper labels, ARIA, focus states, keyboard support   |
| 🎨 Themed States     | Custom hover, focus, disabled, and read-only styles   |
| 🧪 Tested            | Unit tests with Jest & React Testing Library          |

## 🚀 Usage in Pega

### 1. Build & Package
```bash
npm run build
```

### 2. Deploy to Pega
Upload the built component via **App Studio → Design System → Components**.

### 3. Configure in App Studio
- Drag the **Blue Text Box** field onto any form view
- Set the **property binding**, label, placeholder, etc.
- The component will automatically sync values with the Pega case

## 🎨 Customization

Edit `styles.js` to change the blue theme:

```js
// Change primary blue color
background-color: #1a73e8 !important;  /* Main blue */
border: 2px solid #1558b0;             /* Darker border */

// Focus state
background-color: #1558b0 !important;  /* Darker on focus */
box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.35);
```

## ⚙️ Component Properties

| Property        | Type    | Default          | Description                     |
|-----------------|---------|------------------|---------------------------------|
| `label`         | TEXT    | "Blue Text Box"  | Field label text                |
| `value`         | TEXT    | ""               | Bound property value            |
| `placeholder`   | TEXT    | "Enter text..."  | Input placeholder               |
| `helperText`    | TEXT    | ""               | Helper text below input         |
| `required`      | BOOLEAN | false            | Mark as required                |
| `disabled`      | BOOLEAN | false            | Disable the input               |
| `readOnly`      | BOOLEAN | false            | Make input read-only            |
| `hideLabel`     | BOOLEAN | false            | Visually hide the label         |

## 🧪 Run Tests

```bash
npm test -- --testPathPattern="BlueTextBox"
```

---

Built with ❤️ for Pega Constellation
