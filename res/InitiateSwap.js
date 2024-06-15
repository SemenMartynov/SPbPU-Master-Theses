import React, { useState } from 'react';
import styled from 'styled-components';
const { ethers } = require("ethers"); // assuming commonjs

const styles = {
    input: {
        padding: '10px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #ccc'
    }
};


const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;

  &:hover {
    background: #0056b3;
  }
`;

const Message = styled.p`
  margin-top: 10px;
  color: ${props => (props.error ? 'red' : 'green')};
`;

const InitiateSwap = ({ ethContractAddress, ethProvider, btsProvider }) => {
    const [ethRecipient, setEthRecipient] = useState('');
    const [ethAmount, setEthAmount] = useState('');
    const [secret, setSecret] = useState('');
    const [timelock, setTimelock] = useState('');
    const [message, setMessage] = useState('');
    const [isRecipientValid, setIsRecipientValid] = useState(false); // Изначально невалидный

    const generateSecret = () => {
        const newSecret = ethers.hexlify(ethers.randomBytes(32));
        setSecret(newSecret);
    };

    const validateRecipient = (address) => {
        // Проверка валидности Ethereum-адреса
        return ethers.isAddress(address);
    };

    const handleRecipientChange = (e) => {
        const value = e.target.value;
        setEthRecipient(value);
        setIsRecipientValid(validateRecipient(value));
    };

    const initiateSwap = async () => {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            const contract = new ethProvider.eth.Contract(ethContractAddress, [
                "function initiateSwap(address payable _recipient, bytes32 _secretHash, uint256 _timelock) external payable returns (bytes32 contractId)",
            ], account);

            const tx = await contract.initiateSwap(ethRecipient, secret, timelock, {
                value: ethers.parseEther(ethAmount) // Конвертирует ETH в Wei
            });

            console.log('Transaction hash:', tx.hash);

            // Подождите подтверждения транзакции
            const receipt = await tx.wait();
            setMessage(`Transaction confirmed:, ${receipt}`);
        } catch (error) {
            console.error(error);
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <Form>
            <h2>Initiate Swap</h2>
            <input
                type="text"
                placeholder="Ethereum Recipient Address"
                value={ethRecipient}
                onChange={handleRecipientChange}
                style={{
                    ...styles.input,
                    // Применяем стили в зависимости от isRecipientValid
                    borderColor: isRecipientValid ? '#28a745' : '#dc3545',
                    backgroundColor: isRecipientValid ? '#e9f5ec' : '#f8d7da'
                }}
            />
            <Input
                type="text"
                placeholder="ETH Amount"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
            />
            <Input
                type="text"
                placeholder="Secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
            />
            <button onClick={generateSecret}>Generate Secret</button>
            <Input
                type="text"
                placeholder="Timelock (seconds)"
                value={timelock}
                onChange={(e) => setTimelock(e.target.value)}
            />
            <Button onClick={initiateSwap}>Initiate Swap</Button>
            <Message>{message}</Message>
        </Form>
    );
};

export default InitiateSwap;
