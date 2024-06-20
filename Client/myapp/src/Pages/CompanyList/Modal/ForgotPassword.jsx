import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const ForgotPasswordModal = ({ show, handleClose }) => {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Forgot Password</Modal.Title>
      
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="username">
          <Form.Label style={{ color: 'blue' }}>Password Sent Back To Your Registered Mobile Number.</Form.Label>
            <Form.Label>Username</Form.Label>
            <Form.Control type="text" placeholder="Enter your username" />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary">Reset Password</Button>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ForgotPasswordModal;
