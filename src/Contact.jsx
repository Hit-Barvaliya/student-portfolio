import { useState } from "react";

function Contact() {

  const [message, setMessage] = useState("");

  const [showHelp, setShowHelp] = useState(false);

  return (
    <div style={{ padding: "20px" }}>

      <h1>Contact</h1>

      <input
        type="text"
        placeholder="Enter your message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <p>You typed: {message}</p>

      <button onClick={() => setShowHelp(!showHelp)}>
        Toggle Help
      </button>

      {showHelp && (
        <p style={{ color: "blue" }}>
          Enter your message and submit it.
        </p>
      )}

    </div>
  );
}

export default Contact;