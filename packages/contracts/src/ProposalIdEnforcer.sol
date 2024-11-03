// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {CaveatEnforcer} from "@delegation-framework/enforcers/CaveatEnforcer.sol";
import {ModeCode} from "@delegation-framework/utils/Types.sol";
import {IERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import {ProposalNFT} from "./ProposalNFT.sol";

contract ProposalIdEnforcer is CaveatEnforcer {
    struct ProposalIdTerms {
        address nftContract;
        address recipient;
        bytes32 proposalId;
    }

    error NFTNotReceived(address recipient, address nftContract);
    error InvalidProposalId(
        bytes32 expectedProposalId,
        bytes32 actualProposalId
    );

    function beforeHook(
        bytes calldata,
        bytes calldata,
        ModeCode,
        bytes calldata,
        bytes32,
        address,
        address
    ) public pure override {
        // No pre-execution checks needed
    }

    function afterHook(
        bytes calldata _terms,
        bytes calldata,
        ModeCode,
        bytes calldata,
        bytes32,
        address,
        address
    ) public override {
        ProposalIdTerms memory terms = abi.decode(_terms, (ProposalIdTerms));

        IERC721Enumerable nft = IERC721Enumerable(terms.nftContract);
        uint256 balance = nft.balanceOf(terms.recipient);

        if (balance == 0) {
            revert NFTNotReceived(terms.recipient, terms.nftContract);
        }

        uint256 tokenId = nft.tokenOfOwnerByIndex(terms.recipient, balance - 1);

        bytes32 actualProposalId = ProposalNFT(terms.nftContract).getProposalId(
            tokenId
        );

        if (actualProposalId != terms.proposalId) {
            revert InvalidProposalId(terms.proposalId, actualProposalId);
        }
    }
}
