import { toNano } from '@ton/core';
import { SecureTon } from '../wrappers/SecureTon';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const secureTon = provider.open(await SecureTon.fromInit());

    await secureTon.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(secureTon.address);

    // run methods on `secureTon`
}
