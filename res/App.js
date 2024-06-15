import React, { useState } from 'react';
import styled from 'styled-components';
import InitiateSwap from './components/InitiateSwap';
import Withdraw from './components/Withdraw';
import CheckStatus from './components/CheckStatus';
import Refund from './components/Refund';

const Container = styled.div`
  background-color: #f5f7fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: Arial, Helvetica, sans-serif;
`;

const Header = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

const Tab = styled.button`
  background: ${props => (props.active ? "#007bff" : "#ccc")};
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  outline: none;
  margin: 0 5px;
  border-radius: 5px;

  &:hover {
    background: #0056b3;
  }
`;

const Content = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 500px;
`;

function App() {
  // UI
  const [activeTab, setActiveTab] = useState('eth');
  // ETH
  if (!window.ethereum) {
    alert('MetaMask is not installed!');
    return;
  }
  const ethProvider = window.ethereum;
  const ethContractAddress = "0xYourEthereumContractAddress";
  // BTS
  const btsProvider = "wss://your-bitshares-node";

  return (
    <Container>
      <Header>Atomic Swap ETH vs. BTS</Header>
      <TabContainer>
        <Tab active={activeTab === 'eth'} onClick={() => setActiveTab('eth')}>Ethereum</Tab>
        <Tab active={activeTab === 'bts'} onClick={() => setActiveTab('bts')}>BitShares</Tab>
      </TabContainer>
      <Content>
        {activeTab === 'eth' && (
          <>
            <InitiateSwap ethContractAddress={ethContractAddress} ethProvider={ethProvider} btsProvider={btsProvider} />
            <Withdraw ethContractAddress={ethContractAddress} ethProvider={ethProvider} />
            <CheckStatus ethContractAddress={ethContractAddress} ethProvider={ethProvider} btsProvider={btsProvider} activeTab={activeTab} />
            <Refund ethContractAddress={ethContractAddress} ethProvider={ethProvider} />
          </>
        )}
        {activeTab === 'bts' && (
          <div>
            <p>BitShares functionality here</p>
            <p>To initiate an HTLC, use the following command in the BitShares CLI wallet:</p>
            <pre>
              htlc_create &lt;from&gt; &lt;to&gt; &lt;amount&gt; &lt;symbol&gt; &lt;hash_algo&gt; &lt;preimage_hash&gt; &lt;preimage_length&gt; &lt;expiration&gt; &lt;broadcast&gt;
            </pre>
            <p>To redeem funds, use the following command in the BitShares CLI wallet:</p>
            <pre>
              htlc_redeem &lt;htlc_database_id&gt; &lt;fee_paying_account&gt; &lt;preimage&gt; &lt;broadcast&gt;
            </pre>
            <CheckStatus ethContractAddress={ethContractAddress} ethProvider={ethProvider} btsProvider={btsProvider} activeTab={activeTab} />
            <p>In BitShares, there is no need for a refund command. Funds will be automatically returned if the HTLC expires.</p>
          </div>
        )}
      </Content>
    </Container>
  );
}

export default App;
