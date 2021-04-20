pragma solidity ^0.8.0;

import "./MakerlandToken.sol";

contract MakerlandTokenSale {
    address admin;
    MakerlandToken public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold = 0;
    uint256 public tokensToSell;
    uint256 public minimumTokensToSell;
    uint256 public openingTime;
    uint256 public closingTime;
    bool public isOpen;

    mapping (address => uint256) private investorsBalances;
    address[] investorsAddresses;

    modifier onlyWhileOpen {
        if (block.timestamp >= openingTime && block.timestamp <= closingTime) {
            _;
        } else {
            endTokenSale();
        }
    }

    event Sell(address _buyer, uint256 amount);

    constructor(MakerlandToken _tokenContract, uint256 _tokenPrice, uint256 _openingTime, uint256 _closingTime, uint256 _tokensToSell, uint256 _minimumTokensToSell) {
        require(_openingTime >= block.timestamp, "opening time isn't greater than block timestamp");
        require(_closingTime >= _openingTime, "closing time is not greater than opening time");
        require(_minimumTokensToSell > 0, "minimum tokens to sell must be greater than 0");
        require(_tokensToSell > _minimumTokensToSell, "tokens to sell must be greater than minimum tokens to sell");

        admin = msg.sender;
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
        openingTime = _openingTime;
        closingTime = _closingTime;
        tokensToSell = _tokensToSell;
        minimumTokensToSell = _minimumTokensToSell;
        isOpen = true;
    }

    function balanceOf(address account) public view virtual returns (uint256) {
        return investorsBalances[account];
    }

    function endTokenSale() internal virtual {
        if (minimumTokensToSell > 0) {
            for (uint i=0; i<investorsAddresses.length; i++) {
                address addr = investorsAddresses[i];
                uint256 balance = investorsBalances[addr];
                uint256 balanceInWei = balance * tokenPrice;
                (bool sent, bytes memory data) = payable(addr).call{value: balanceInWei - 20317, gas: 20317}("");
                require(sent, "ERC20: Failed to send Ether");
            }
        } else if (minimumTokensToSell == 0 && tokensToSell != 0) {
            require(tokenContract.transfer(admin, tokensToSell), "ERC20: failed to transfer MKL tokens to admin");
            bool sent = payable(admin).send(address(this).balance);
            require(sent, "ERC20: Failed to send Ether");
            for (uint i=0; i<investorsAddresses.length; i++) {
                address addr = investorsAddresses[i];
                uint256 balance = investorsBalances[addr];
                require(tokenContract.transfer(addr, balance), "ERC20: failed to allocate tokens");
            }
        } else if (minimumTokensToSell == 0 && tokensToSell == 0) {
            bool sent = payable(admin).send(address(this).balance);
            require(sent, "ERC20: Failed to send Ether");
            for (uint i=0; i<investorsAddresses.length; i++) {
                address addr = investorsAddresses[i];
                uint256 balance = investorsBalances[addr];
                require(tokenContract.transfer(addr, balance), "ERC20: failed to allocate tokens");
            }
        }
        isOpen = false;
        selfdestruct(payable(admin));
    }

    function buyTokens(uint256 _numberOfTokens) public payable {
        require(tokensToSell >= _numberOfTokens, "ERC20: not enough tokens available");
        require(msg.value == _numberOfTokens * tokenPrice, "ERC20: wrong token price");
        investorsBalances[msg.sender] += _numberOfTokens;
        investorsAddresses.push(msg.sender);
        tokensSold += _numberOfTokens;
        tokensToSell -= _numberOfTokens;
        if (minimumTokensToSell >= _numberOfTokens) {
            minimumTokensToSell -= _numberOfTokens;
        } else if (minimumTokensToSell != 0) {
            minimumTokensToSell = 0;
        }
        Sell(msg.sender, _numberOfTokens);
    }

    function hasClosed() public view returns (bool) {
        return !isOpen;
    }
}