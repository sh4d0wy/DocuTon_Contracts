import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { NftTicket } from '../wrappers/NftTicket';
import '@ton/test-utils';

describe('NftTicket', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nftTicket: SandboxContract<NftTicket>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        nftTicket = blockchain.openContract(await NftTicket.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await nftTicket.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftTicket.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and nftTicket are ready to use
    });
});
