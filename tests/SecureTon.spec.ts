import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { SecureTon } from '../wrappers/SecureTon';
import '@ton/test-utils';

describe('SecureTon', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let secureTon: SandboxContract<SecureTon>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        secureTon = blockchain.openContract(await SecureTon.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await secureTon.send(
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
            to: secureTon.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and secureTon are ready to use
    });
});
