const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

// ethereum-cryptography
const secp = require('ethereum-cryptography/secp256k1');
const { keccak256 } = require('ethereum-cryptography/keccak');
const { toHex, utf8ToBytes } = require('ethereum-cryptography/utils');

app.use(cors());
app.use(express.json());

const balances = {
  "04bdb209497c64dd7ef8da4e6fc4b17e31f5f7992826f603bc88f31e14a2c0377e94e18619f0d7a1d27666f68ec72ad284041c6bd6b82868db7aa665e2f3a10854": 100,
  // private key : 7a659928714cfc6f610fa07aecfb321596d2054ac198bd922a075b3fb57ce83b
  "045f3d956d09782a97eb3c37534c5b7d82ad84e8dce0506135d7743155aed4b865d14f591316e2ff7411c3db62554f88230c8c826606270a47d3ccf21615588340": 50,
  // private key : 19ba4c3d7e80fecbb6adaf1c356c49727dc10d0c85ace4e589eb545abfa0971d
  "04b027530c5a7ca0519289a23a88f16743a5de4fa51d9c00b93104ca29dbe7684517f5aec55fb881d7cb1772e2fc4138f5b595f5e2abc3096affd6228c84448b7b": 75,
  // private key : 3f1d094b8fc8ba10da458cd10417e088f90fba87218ef478b693a290fc7d05d2
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { signature, sender, recipient, amount } = req.body;

  setInitialBalance(sender);
  setInitialBalance(recipient);

  // re-create message hash
  const parseIntAmount = parseInt(amount);
  const messageHash = createMessageHash(sender,recipient,parseIntAmount);

  // verify signature
  const [signatureData, recoveryBit] = signature;
  const formatSignature = Uint8Array.from(Object.values(signatureData));
  const publicKey = secp.recoverPublicKey(messageHash, formatSignature, recoveryBit);
  const isVerified = secp.verify(formatSignature, messageHash, publicKey);

  try {
    if (sender != toHex(publicKey)) {
      res.status(400).send({ message: "Invalid sender!" });
    } else if (!isVerified) {
      res.status(400).send({ message: "Invalid signature!" });
    } else if (balances[sender] < parseIntAmount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= parseIntAmount;
      balances[recipient] += parseIntAmount;
      res.send({ balance: balances[sender] });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error!" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}

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
