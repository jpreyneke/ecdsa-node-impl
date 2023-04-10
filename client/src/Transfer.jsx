import { useState } from "react";
import server from "./server";
import * as secp from 'ethereum-cryptography/secp256k1';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { toHex, utf8ToBytes } from 'ethereum-cryptography/utils';

function createMessageHash(sender, recipient, amount) {
  const message = {
    sender,
    recipient,
    amount
  };
  const messageInBytes = utf8ToBytes(JSON.stringify(message));
  const messageHash = keccak256(messageInBytes);
  return messageHash;
}

function Transfer({ address, setBalance }) {
  const [sendAmount, setSendAmount] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

  // get PublicKey
  const senderPublicKey = address;

  // create message hash
  const messageHash = createMessageHash(senderPublicKey,recipient,parseInt(sendAmount));

  // create signature
  const signOptions = {
    recovered: true
  };
  const senderSignature = await secp.sign(messageHash,privateKey,signOptions);
  //const [signatureData, recoveryBit] = senderSignature;

  try {
    const {
      data: { balance },
    } = await server.post(`send`, {
      signature: senderSignature,
      sender: senderPublicKey,
      recipient,
      amount: sendAmount
    });
    setBalance(balance);
  } catch (ex) {
    console.log(ex);
    alert(ex.response.data.message);
  }
}
  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>
      <label>
        Send Amount (required)
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>
      <label>
        Your Private Key (required)
        <input
          placeholder="Type your private key..."
          value={privateKey}
          onChange={setValue(setPrivateKey)}
        ></input>
      </label>
      <label>
        Recipient (required)
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>
      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
