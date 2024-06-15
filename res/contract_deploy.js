const HTLCContract = artifacts.require("HTLCContract");

module.exports = function (deployer) {
  deployer.deploy(HTLCContract);
};