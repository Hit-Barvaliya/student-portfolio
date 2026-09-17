import { useState } from "react";
import "../Contact.css";

function Contact() {
  const [message, setMessage] = useState("");

  return (
    <div className="contact-container">
      <div className="contact-card">
        <h1>Contact Me</h1>

        <input
          type="text"
          placeholder="Enter your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <h3>Your Message:</h3>

        <div className="output-box">
          <h3>Live Output</h3>

          <p className="live-message">{message || "Start typing..."}</p>

          <hr />

          <p>
            <strong>Character Count:</strong> {message.length}
          </p>
        </div>

        <button className="send-btn">Send Message</button>
      </div>
    </div>
  );
}

export default Contact;
