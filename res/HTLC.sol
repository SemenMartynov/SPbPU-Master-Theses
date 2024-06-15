// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Hashed Timelock Contracts (HTLCs) on Ethereum for ETH.
 *
 * This contract provides a way to create and manage HTLCs for ETH.
 *
 * Protocol:
 *
 *  1) initiateSwap(receiver, secretHash, timelock) - a sender calls this to create
 *  a new HTLC and gets back a unique identifier.
 *  2) withdraw(swapId, secret) - once the receiver knows the preimage of
 *  the secret hash, they can claim the ETH with this function.
 *  3) refund(swapId) - after timelock has expired and if the receiver did not
 *   withdraw funds, the sender/creator of the HTLC can retrieve their ETH
 *   with this function.
 */

contract AtomicSwap {
    // Struct to hold information about each swap
    struct Swap {
        address payable sender;    // ETH sender
        address payable recipient; // ETH recipient
        uint256 amount;            // Amount of ETH to be swapped
        bytes32 secretHash;        // Hash of the secret key
        uint256 timelock;          // Time until which the swap must be completed
        bool withdrawn;            // Flag indicating if ETH has already been withdrawn
        bool refunded;             // Flag indicating if ETH has already been refunded
        bytes32 secret;            // Secret key (initially empty)
    }

    // Mapping to store swaps by their identifiers
    mapping(bytes32 => Swap) public swaps;

    // Events to log important actions
    event SwapInitiated(
        bytes32 indexed swapId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        bytes32 secretHash,
        uint256 timelock
    );
    event Withdraw(
        bytes32 indexed swapId,
        bytes32 secret
    );
    event Refund(bytes32 indexed swapId);

    /**
     * @dev Sender sets up a new hash time lock contract depositing the ETH and
     * providing the receiver lock terms.
     *
     * @param _recipient Receiver of the ETH.
     * @param _secretHash A sha256 hash hashlock.
     * @param _timelock UNIX epoch seconds time that the lock expires at.
     * @return contractId Id of the new HTLC. This is needed for subsequent actions.
     */
    function initiateSwap(address payable _recipient, bytes32 _secretHash, uint256 _timelock)
    external
    payable
    returns (bytes32 contractId)
    {
        require(_recipient != address(0), "Invalid recipient address");
        require(msg.value > 0, "Amount must be greater than 0");
        require(_timelock > block.timestamp, "Timelock time must be in the future");

        bytes32 _swapId = sha256(
            abi.encodePacked(
                msg.sender,
                _recipient,
                msg.value,
                _secretHash,
                _timelock
            )
        );

        Swap storage swap = swaps[_swapId];
        require(swap.amount == 0, "Swap already exists");

        swaps[_swapId] = Swap({
            sender: payable(msg.sender),
            recipient: _recipient,
            amount: msg.value,
            secretHash: _secretHash,
            timelock: _timelock,
            withdrawn: false,
            refunded: false,
            secret: 0x0 // The secret is empty.
        });

        // Generate a log message
        emit SwapInitiated(_swapId, msg.sender, _recipient, msg.value, _secretHash, _timelock);
        // Return contractId
        return _swapId;
    }

    /**
     * @dev Receiver withdraws ETH using the preimage of the secret key.
     *
     * @param _swapId Identifier of the swap.
     * @param _secret Preimage of the secret key.
     */
    function withdraw(bytes32 _swapId, bytes32 _secret)
    external
    {
        Swap storage swap = swaps[_swapId];
        require(swap.amount > 0, "Swap does not exist");
        require(swap.recipient == msg.sender, "Only recipient can withdraw");
        require(swap.secretHash == keccak256(abi.encodePacked(_secret)), "Invalid secret");
        require(block.timestamp < swap.timelock, "Timelock has expired");
        require(!swap.withdrawn, "Already withdrawn");

        swap.withdrawn = true; // Status update
        swap.secret = _secret; // Save the secret.

        emit Withdraw(_swapId, _secret);

        swap.recipient.transfer(swap.amount); // Transfer the ETH.
    }

    /**
     * @dev Sender refunds ETH after timelock has expired.
     *
     * @param _swapId Identifier of the swap.
     */
    function refund(bytes32 _swapId) external {
        Swap storage swap = swaps[_swapId];
        require(swap.amount > 0, "Swap does not exist");
        require(swap.sender == msg.sender, "Only sender can refund");
        require(block.timestamp >= swap.timelock, "Timelock has not expired");
        require(!swap.refunded, "Already refunded");

        swap.refunded = true; // Status update

        emit Refund(_swapId);

        swap.sender.transfer(swap.amount);
    }

    /**
     * @dev Gets the hash of the secret key for a given swap.
     *
     * @param _swapId Identifier of the swap.
     * @return secretHash Hash of the secret key.
     */
    function getSecretHash(bytes32 _swapId) public view returns (bytes32) {
        return swaps[_swapId].secretHash;
    }

    /**
     * @dev Gets the secret key for a given swap after it has been withdrawn.
     *
     * @param _swapId Identifier of the swap.
     * @return secret The secret key.
     */
    function getSecret(bytes32 _swapId) public view returns (bytes32) {
        require(swaps[_swapId].withdrawn == true, "Secret not available yet");
        return swaps[_swapId].secret;
    }
}
