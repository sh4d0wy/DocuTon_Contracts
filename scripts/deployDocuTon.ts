import { toNano } from '@ton/core';
import { DocuTon } from '../wrappers/DocuTon';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const docuTon = provider.open(await DocuTon.fromInit());

    await docuTon.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(docuTon.address);

    // run methods on `docuTon`
}
