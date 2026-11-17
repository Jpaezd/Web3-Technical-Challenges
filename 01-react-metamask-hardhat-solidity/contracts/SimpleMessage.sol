// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleMessage {
    string private message;

    event MessageUpdated(string newMessage);

    constructor(string memory initialMessage) {
        message = initialMessage;
    }

    function setMessage(string memory newMessage) public {
        message = newMessage;
        emit MessageUpdated(newMessage);
    }

    function getMessage() public view returns (string memory) {
        return message;
    }
}