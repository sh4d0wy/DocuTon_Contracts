// import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
// import { toNano } from '@ton/core';
// import { SecureTon } from '../wrappers/SecureTon';
// import '@ton/test-utils';

// describe('SecureTon', () => {
//     let blockchain: Blockchain;
//     let deployer: SandboxContract<TreasuryContract>;
//     let secureTon: SandboxContract<SecureTon>;

//     beforeEach(async () => {
//         blockchain = await Blockchain.create();

//         secureTon = blockchain.openContract(await SecureTon.fromInit());

//         deployer = await blockchain.treasury('deployer');

//         const deployResult = await secureTon.send(
//             deployer.getSender(),
//             {
//                 value: toNano('0.05'),
//             },
//             {
//                 $$type: 'Deploy',
//                 queryId: 0n,
//             }
//         );

//         expect(deployResult.transactions).toHaveTransaction({
//             from: deployer.address,
//             to: secureTon.address,
//             deploy: true,
//             success: true,
//         });
//     });

//     it('should deploy', async () => {
//         // the check is done inside beforeEach
//         // blockchain and secureTon are ready to use
//     });
// });

import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { SecureTon } from '../wrappers/SecureTon';
import '@ton/test-utils';

describe('EventTicketSystem', () => {
    let blockchain: Blockchain;
    let eventSystem: SandboxContract<SecureTon>;
    let deployer: SandboxContract<TreasuryContract>;
    let user1: SandboxContract<TreasuryContract>;
    let user2: SandboxContract<TreasuryContract>;
    
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user1 = await blockchain.treasury('user1');
        user2 = await blockchain.treasury('user2');
        
        eventSystem = blockchain.openContract(
            await SecureTon.fromInit()
        );
        
        const deployResult = await eventSystem.send(
            deployer.getSender(),
            {
                value: toNano('1')
            },
            {
                $$type: 'Deploy',
                queryId: 0n
            }
        );
        
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: eventSystem.address,
            success: true
        });
    });

    describe('Create Event', () => {
        it('should create event with valid parameters', async () => {
            const futureDate = Math.floor(Date.now() / 1000) + 86400; // Tomorrow
            
            const result = await eventSystem.send(
                user1.getSender(),
                {
                    value: toNano('0.1')
                },
                {
                    $$type: 'CreateEvent',
                    name: 'Test Event',
                    date: BigInt(futureDate),
                    ticketPrice: toNano('1'),
                    maxTickets: 100n
                }
            );
            
            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: eventSystem.address,
                success: true
            });
            
            const event = await eventSystem.getEvent(0n);
            expect(event.name).toBe('Test Event');
            expect(event.isActive).toBe(true);
        });
        
        // it('should reject event creation with past date', async () => {
        //     const pastDate = Math.floor(Date.now() / 1000) - 86400; // Yesterday
            
        //     const result = await eventSystem.send(
        //         user1.getSender(),
        //         {
        //             value: toNano('0.1')
        //         },
        //         {
        //             $$type: 'CreateEvent',
        //             name: 'Past Event',
        //             date: BigInt(pastDate),
        //             ticketPrice: toNano('1'),
        //             maxTickets: 100n
        //         }
        //     );
            
        //     expect(result.transactions).toHaveTransaction({
        //         success: false,
        //         exitCode: 40 // Assuming this is the error code for invalid date
        //     });
        // });
    });

    describe('Buy Ticket', () => {
        beforeEach(async () => {
            // Create an event first
            const futureDate = Math.floor(Date.now() / 1000) + 86400;
            await eventSystem.send(
                user1.getSender(),
                {
                    value: toNano('0.1')
                },
                {
                    $$type: 'CreateEvent',
                    name: 'Test Event',
                    date: BigInt(futureDate),
                    ticketPrice: toNano('1'),
                    maxTickets: 100n
                }
            );
        });
        
        it('should allow ticket purchase with sufficient payment', async () => {
            const result = await eventSystem.send(
                user2.getSender(),
                {
                    value: toNano('1.1') // Ticket price + gas
                },
                {
                    $$type: 'BuyTicket',
                    eventId: 0n
                }
            );
            
            expect(result.transactions).toHaveTransaction({
                from: user2.address,
                to: eventSystem.address,
                success: true
            });
            
            const ticket = await eventSystem.getTicket(0n);
            expect(ticket.owner.toString()).toBe(user2.address.toString());
            expect(ticket.isUsed).toBe(false);
        });
        
        it('should reject ticket purchase with insufficient payment', async () => {
            const result = await eventSystem.send(
                user2.getSender(),
                {
                    value: toNano('0.5') // Less than ticket price
                },
                {
                    $$type: 'BuyTicket',
                    eventId: 0n
                }
            );
            
            expect(result.transactions).toHaveTransaction({
                success: false
            });
        });
        
        it('should update tickets sold count', async () => {
            await eventSystem.send(
                user2.getSender(),
                {
                    value: toNano('1.1')
                },
                {
                    $$type: 'BuyTicket',
                    eventId: 0n
                }
            );
            
            const event = await eventSystem.getEvent(0n);
            expect(event.ticketsSold).toBe(1n);
        });
    });

    describe('Use Ticket', () => {
        beforeEach(async () => {
            // Create event and buy ticket
            const futureDate = Math.floor(Date.now() / 1000) + 86400;
            await eventSystem.send(
                user1.getSender(),
                {
                    value: toNano('0.1')
                },
                {
                    $$type: 'CreateEvent',
                    name: 'Test Event',
                    date: BigInt(futureDate),
                    ticketPrice: toNano('1'),
                    maxTickets: 100n
                }
            );
            
            await eventSystem.send(
                user2.getSender(),
                {
                    value: toNano('1.1')
                },
                {
                    $$type: 'BuyTicket',
                    eventId: 0n
                }
            );
        });
        
        it('should mark ticket as used', async () => {
            const result = await eventSystem.send(
                user2.getSender(),
                {
                    value: toNano('0.1')
                },
                {
                    $$type: 'UseTicket',
                    ticketId: 0n
                }
            );
            
            expect(result.transactions).toHaveTransaction({
                success: true
            });
            
            const ticket = await eventSystem.getTicket(0n);
            expect(ticket.isUsed).toBe(true);
        });
        
        it('should reject using same ticket twice', async () => {
            // Use ticket first time
            await eventSystem.send(
                user2.getSender(),
                {
                    value: toNano('0.1')
                },
                {
                    $$type: 'UseTicket',
                    ticketId: 0n
                }
            );
            
            // Try to use ticket second time
            const result = await eventSystem.send(
                user2.getSender(),
                {
                    value: toNano('0.1')
                },
                {
                    $$type: 'UseTicket',
                    ticketId: 0n
                }
            );
            
            expect(result.transactions).toHaveTransaction({
                success: false
            });
        });
    });

    describe('Deactivate Event', () => {
        beforeEach(async () => {
            const futureDate = Math.floor(Date.now() / 1000) + 86400;
            await eventSystem.send(
                user1.getSender(),
                {
                    value: toNano('0.1')
                },
                {
                    $$type: 'CreateEvent',
                    name: 'Test Event',
                    date: BigInt(futureDate),
                    ticketPrice: toNano('1'),
                    maxTickets: 100n
                }
            );
        });
        
        it('should allow creator to deactivate event', async () => {
            const result = await eventSystem.send(
                user1.getSender(), // Original creator
                {
                    value: toNano('0.1')
                },
                {
                    $$type: 'DeactivateEvent',
                    eventId: 0n
                }
            );
            
            expect(result.transactions).toHaveTransaction({
                success: true
            });
            
            const event = await eventSystem.getEvent(0n);
            expect(event.isActive).toBe(false);
        });
        
        it('should reject deactivation from non-creator', async () => {
            const result = await eventSystem.send(
                user2.getSender(), // Not the creator
                {
                    value: toNano('0.1')
                },
                {
                    $$type: 'DeactivateEvent',
                    eventId: 0n
                }
            );
            
            expect(result.transactions).toHaveTransaction({
                success: false
            });
            
            const event = await eventSystem.getEvent(0n);
            expect(event.isActive).toBe(true);
        });
    });

    describe('Getter Functions', () => {
        beforeEach(async () => {
            // Create two events
            const futureDate = Math.floor(Date.now() / 1000) + 86400;
            await eventSystem.send(
                user1.getSender(),
                {
                    value: toNano('0.1')
                },
                {
                    $$type: 'CreateEvent',
                    name: 'Event 1',
                    date: BigInt(futureDate),
                    ticketPrice: toNano('1'),
                    maxTickets: 100n
                }
            );
            
            await eventSystem.send(
                user1.getSender(),
                {
                    value: toNano('0.1')
                },
                {
                    $$type: 'CreateEvent',
                    name: 'Event 2',
                    date: BigInt(futureDate),
                    ticketPrice: toNano('1'),
                    maxTickets: 100n
                }
            );
        });
        
        it('should return correct event details', async () => {
            const event = await eventSystem.getEvent(0n);
            expect(event.name).toBe('Event 1');
            expect(event.isActive).toBe(true);
        });
        
        it('should verify ticket ownership correctly', async () => {
            // Buy a ticket first
            await eventSystem.send(
                user2.getSender(),
                {
                    value: toNano('1.1')
                },
                {
                    $$type: 'BuyTicket',
                    eventId: 0n
                }
            );
            
            const isValid = await eventSystem.getVerifyTicket(0n, user2.address);
            expect(isValid).toBe(true);
        });
        
        it('should return all active events', async () => {
            // Deactivate one event
            await eventSystem.send(
                user1.getSender(),
                {
                    value: toNano('0.1')
                },
                {
                    $$type: 'DeactivateEvent',
                    eventId: 0n
                }
            );
            
            const activeEvents = await eventSystem.getGetActiveEvents();
            console.log(activeEvents);
            const activeEventsList = Object.values(activeEvents);
            expect(activeEventsList.length).toBe(1);
            expect(activeEventsList[0].name).toBe('Event 2');
        });
    });
});