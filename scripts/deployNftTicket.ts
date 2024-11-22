import { toNano } from '@ton/core';
import { NftTicket } from '../wrappers/NftTicket';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const nftTicket = provider.open(await NftTicket.fromInit());

    await nftTicket.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(nftTicket.address);

    // run methods on `nftTicket`
}
