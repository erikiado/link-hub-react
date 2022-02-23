import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/LinkHub.json";

const App = () => {

  const [input, setInput] = useState("");
  const [linkCount, setLinkCount] = useState(0);
  const [allLinks, setAllLinks] = useState([]);
  const [currentAccount, setCurrentAccount] = useState("");
  const contractAddress = "0xFE24982CAF37A3Fc2d64a98db2998f723F855466";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method here
  */
   const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const getAllLinks = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const linkHubContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const links = await linkHubContract.getAllLinks();


        /*
         * We only need address, timestamp, and url in our UI so let's
         * pick those out
         */
        let linksCleaned = [];
        links.forEach(lnk => {
          linksCleaned.push({
            address: lnk.linker,
            timestamp: new Date(lnk.timestamp * 1000),
            url: lnk.url
          });
        });

        /*
         * Store our data in React State
         */
        setAllLinks(linksCleaned);
        setLinkCount(linksCleaned.length);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const sendLink = async () => {

    if(!input){
      window.alert('url is null');
      return;
    }
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const linkHubContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await linkHubContract.getTotalLinks();
        console.log("Retrieved total link count...", count.toNumber());

        const linkTxn = await linkHubContract.link(input, { gasLimit: 300000 });
        console.log("Mining...", linkTxn.hash);

        await linkTxn.wait();
        console.log("Mined -- ", linkTxn.hash);

        count = await linkHubContract.getTotalLinks();
        console.log("Retrieved total wave count...", count.toNumber());

        setLinkCount(count.toNumber());


      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
}

  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    checkIfWalletIsConnected();
    getAllLinks();
  }, [])

  useEffect(() => {
    let linkHubContract;
  
    const onNewLink = (from, timestamp, url) => {
      console.log("NewLink", from, timestamp, url);
      setAllLinks(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          url: url,
        },
      ]);
    };
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      linkHubContract = new ethers.Contract(contractAddress, contractABI, signer);
      linkHubContract.on("NewLink", onNewLink);
    }
  
    return () => {
      if (linkHubContract) {
        linkHubContract.off("NewLink", onNewLink);
      }
    };
  }, []);

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        <span role="img" aria-label="wave">👋</span> hey there!
        </div>

        <div className="bio">
        i am erikiado and i'm trying out web3. connect your ethereum wallet and send me a link!
        </div>

        <input value={input} 
            type="text"
            placeholder="https://..."
            onChange={e => setInput(e.target.value)} />
        <button className="waveButton" onClick={sendLink}>
          send
        </button>

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            connect wallet
          </button>
        )}


        <div>
          current links: {linkCount}
        </div>

        {allLinks.map((lnk, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>sender: {lnk.address}</div>
              <div>time: {lnk.timestamp.toString()}</div>
              <div>link: {lnk.url}</div>
            </div>)
        })}
      </div>
    </div>
  );
}

export default App;