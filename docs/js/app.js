App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 10000000000000,
  tokensSold: 0,
  tokensAvailable: 75000000,
  userMessage: false,
  abi: [
    {
      "inputs": [
        {
          "internalType": "contract MakerlandToken",
          "name": "_tokenContract",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_tokenPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_openingTime",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_closingTime",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_tokensToSell",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_minimumTokensToSell",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "_buyer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "Sell",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "closingTime",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "isOpen",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "minimumTokensToSell",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "openingTime",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokenContract",
      "outputs": [
        {
          "internalType": "contract MakerlandToken",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokenPrice",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokensSold",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokensToSell",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_numberOfTokens",
          "type": "uint256"
        }
      ],
      "name": "buyTokens",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "hasClosed",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],

  init: function() {
    console.log("App initialized...")
    return App.initWeb3();
  },

  initWeb3: function() {
   if (window.web3) {
    window.web3 = new Web3(window.web3.currentProvider);
    App.web3Provider = window.web3.currentProvider;
    window.ethereum.enable();
   } else {
      $('#message').html("Please use a DAPP Browser");
      App.userMessage = true;
   }
    return App.initContracts();
  },

  initContracts: function() {
    $.getJSON("MakerlandTokenSale.json", function(dappTokenSale) {
      App.contracts.DappTokenSale = TruffleContract(dappTokenSale);
      App.contracts.DappTokenSale.setProvider(App.web3Provider);
      App.contracts.DappTokenSale.deployed().then(function(dappTokenSale) {
      });
    }).done(function() {
      $.getJSON("MakerlandToken.json", function(dappToken) {
        App.contracts.DappToken = TruffleContract(dappToken);
        App.contracts.DappToken.setProvider(App.web3Provider);
        App.contracts.DappToken.deployed().then(function(dappToken) {
        });

        App.listenForEvents();
        return App.render();
      });
    })
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.DappTokenSale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        if (error) {
          $('#message').html("An error has occured. Please accept the transaction and make sure your balance is sufficient.");
          App.userMessage = true;
        }
        App.render();
      })
    })
  },

  render: function() {
    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $('#accountAddress').html("Your Account: " + account);
      }
    })
   
    var loader  = $('#loader');
    var content = $('#content');

    if (App.userMessage == false) {
      App.loading = true;
      loader.show();
      content.hide();
    } else {
      loader.hide();
      content.hide();
      App.loading = false;
    }
    
    App.web3Provider.on('accountsChanged', function (accounts) {
        App.account = accounts[0];
        $('#accountAddress').html("Your Account: " + App.account);
        App.contracts.DappTokenSale.deployed().then(function(instance) {
          dappTokenInstance = instance;
          return dappTokenInstance.balanceOf.call(App.account);
        }).then(function(balance) {
          $('.dapp-balance').html(balance.toNumber());
        });
    });

    // Load token sale contract
    App.contracts.DappTokenSale.deployed().then(function(instance) {
      dappTokenSaleInstance = instance;
      console.log(instance);
      return dappTokenSaleInstance.tokenPrice.call();
    }).then(function(tokenPrice) {
      App.tokenPrice = tokenPrice;
      $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
      return dappTokenSaleInstance.tokensSold.call();
    }).then(function(tokensSold) {
      App.tokensSold = tokensSold.toNumber();
      $('.tokens-sold').html(App.tokensSold);
      $('.tokens-available').html(App.tokensAvailable);

      var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
      $('#progress').css('width', progressPercent + '%');
      return dappTokenSaleInstance.hasClosed.call();
    }).then(function(status) {
      if (status == true) {
        $('.status').html("closed");
      } else if (status == false) {
        $('.status').html("open");
      }
      // Load token sale contract
      App.contracts.DappTokenSale.deployed().then(function(instance) {
        dappTokenSaleInstance = instance;
        return dappTokenSaleInstance.balanceOf.call(App.account);
      }).then(function(balance) {
        $('.dapp-balance').html(balance.toNumber());
        App.loading = false;
        loader.hide();
        content.show();
      })
    });
  },

  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    var contract = web3.eth.contract(App.abi);
    var final = contract.at("0x2Bbb31304EF8a949a9a657831c39a996FC81F5E1");
    final.buyTokens.sendTransaction(numberOfTokens, {
          from: App.account,
          value: numberOfTokens * App.tokenPrice,
          gas: 500000 // Gas limit
    }).then(function(result) {
        console.log("Tokens bought...")
        $('form').trigger('reset') // reset number of tokens in form
        $('#loader').hide();
        $('#content').show();
        // Wait for Sell event
      }).catch(function(err) {
        $('#loader').hide();
        $('#content').hide();
        $('#message').html(err.message);
        App.userMessage = true;
      });
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  })
});
