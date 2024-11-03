// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ProposalNFT is ERC721Enumerable, ERC721URIStorage {
    using ECDSA for bytes32;

    struct Proposal {
        address creator;
        uint256 minimumFunding;
        IERC20 biddingToken;
        uint256 tokenIdCounter;
        bool isClosed;
        uint256 nonce;
    }

    mapping(bytes32 => Proposal) public proposals;
    mapping(uint256 => bytes32) private _tokenProposalIds;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function createProposal(uint256 _minimumFunding, address _biddingToken, uint256 _nonce) public returns (bytes32) {
        bytes32 proposalId = keccak256(abi.encodePacked(msg.sender, _minimumFunding, _biddingToken, _nonce));
        require(proposals[proposalId].creator == address(0), "Proposal already exists");

        proposals[proposalId] = Proposal({
            creator: msg.sender,
            minimumFunding: _minimumFunding,
            biddingToken: IERC20(_biddingToken),
            tokenIdCounter: 0,
            isClosed: false,
            nonce: _nonce
        });
        return proposalId;
    }

    // Recommended delegation: Owner should wrap this call with a caveat enforcing minimum funding
    // Recommended delegation: Bidders should wrap their bids with a caveat enforcing NFT receipt
    function closeBids(bytes32 proposalId, address[] calldata recipients) public {
        Proposal storage proposal = proposals[proposalId];
        require(msg.sender == proposal.creator, "Only creator can close bids");
        require(!proposal.isClosed, "Bidding already closed");

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = uint256(proposalId) + proposal.tokenIdCounter;
            _safeMint(recipients[i], tokenId);
            _tokenProposalIds[tokenId] = proposalId;
            proposal.tokenIdCounter++;
        }

        proposal.isClosed = true;
    }

    // Helper function to compute proposalId offchain
    function computeProposalId(
        address creator,
        uint256 minimumFunding,
        address biddingToken,
        uint256 nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(creator, minimumFunding, biddingToken, nonce));
    }

    // Getter for the proposalId associated with a token
    function getProposalId(uint256 tokenId) public view returns (bytes32) {
        require(_exists(tokenId), "ERC721: invalid token ID");
        return _tokenProposalIds[tokenId];
    }

    // Override required functions

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
