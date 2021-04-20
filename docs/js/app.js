App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 10000000000000,
  tokensSold: 0,
  tokensAvailable: 75000000,

  init: function() {
    console.log("App initialized...")
    return App.initWeb3();
  },

  initWeb3: function() {
   if (window.web3) {
    window.web3 = new Web3(window.web3.currentProvider);
    App.web3Provider = window.web3.currentProvider;
    window.ethereum.enable();
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
      console.log(account);
    })
    
    App.loading = false;
    var loader  = $('#loader');
    var content = $('#content');

    loader.hide();
    content.show();

    App.web3Provider.on('accountsChanged', function (accounts) {
        App.account = accounts[0];
        $('#accountAddress').html("Your Account: " + App.account);
        App.contracts.DappTokenSale.deployed().then(function(instance) {
          dappTokenInstance = instance;
          return dappTokenInstance.balanceOf(App.account);
        }).then(function(balance) {
          $('.dapp-balance').html(balance.toNumber());
        });
    });

    // Load token sale contract
    App.contracts.DappTokenSale.deployed().then(function(instance) {
      dappTokenSaleInstance = instance;
      return dappTokenSaleInstance.methods.tokenPrice().call();
    }).then(function(tokenPrice) {
      App.tokenPrice = tokenPrice;
      $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
      return dappTokenSaleInstance.tokensSold();
    }).then(function(tokensSold) {
      App.tokensSold = tokensSold.toNumber();
      $('.tokens-sold').html(App.tokensSold);
      $('.tokens-available').html(App.tokensAvailable);

      var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
      $('#progress').css('width', progressPercent + '%');

      // Load token contract
      App.contracts.DappTokenSale.deployed().then(function(instance) {
        dappTokenInstance = instance;
        return dappTokenInstance.balanceOf(App.account);
      }).then(function(balance) {
        $('.dapp-balance').html(balance.toNumber());
      })
    });
  },

  buyTokens: function() {
    var numberOfTokens = $('#numberOfTokens').val();
    App.contracts.DappTokenSale.deployed().then(function(instance) {
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: numberOfTokens * App.tokenPrice,
        gas: 500000 // Gas limit
      });
    }).then(function(result) {
      console.log("Tokens bought...")
      $('form').trigger('reset') // reset number of tokens in form
      // Wait for Sell event
    });
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  })
});
