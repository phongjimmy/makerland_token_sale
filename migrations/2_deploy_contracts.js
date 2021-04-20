const MakerLand = artifacts.require("./MakerlandToken.sol");
const MakerLandSale = artifacts.require("./MakerlandTokenSale.sol");

module.exports = function (deployer) {
  deployer.deploy(MakerLand).then(function() {
    var tokenPrice = 10000000000000; // in wei
    var date = new Date();
    var time = date.getTime();
    return deployer.deploy(MakerLandSale, MakerLand.address, tokenPrice, Math.round((time + 20000) / 1000), Math.round((time + 2592000) / 1000), 75000000, 50000000);
  });
};
