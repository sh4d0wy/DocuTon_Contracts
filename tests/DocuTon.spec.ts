import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { DocuTon } from '../wrappers/DocuTon';
import '@ton/test-utils';

describe('DocuTon', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let docuTon: SandboxContract<DocuTon>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        docuTon = blockchain.openContract(await DocuTon.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await docuTon.send(
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
            to: docuTon.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and docuTon are ready to use
    });
});
