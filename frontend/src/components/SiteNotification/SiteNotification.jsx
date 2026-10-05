import React from "react";
import { FiCheckCircle, FiX } from "react-icons/fi";
import "./SiteNotification.css";

const SiteNotification = ({ notification, onClose }) => (
  <div className="site-notification-overlay">
    <section
      className="site-notification-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-notification-title"
    >
      <button
        className="site-notification-close"
        type="button"
        onClick={onClose}
        aria-label="Close notification"
      >
        <FiX />
      </button>
      <span className="site-notification-icon"><FiCheckCircle /></span>
      <span className="site-notification-eyebrow">TOMATO UPDATE</span>
      <h2 id="site-notification-title">{notification.title}</h2>
      <p>{notification.message}</p>
      <button
        className="site-notification-continue"
        type="button"
        onClick={onClose}
      >
        Continue
      </button>
    </section>
  </div>
);

export default SiteNotification;
