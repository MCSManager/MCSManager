const net = require('net');

// Using SLT (Server List Ping) provided by Minecraft.
// Since it is part of the protocol it is always enabled contrary to Query
// More information at: https://wiki.vg/Server_List_Ping#Response
// Github: https://github.com/Vaksty/mcping

class MCServStatus {
    constructor(port, host) {
        this.port = port;
        this.host = host;
        this.status = {
            online: null,
            version: null,
            motd: null,
            current_players: null,
            max_players: null,
            latency: null
        }
    }

    getStatus() {
        return new Promise((resolve, reject) => {
            var start_time = new Date();
            const client = net.connect(this.port, this.host, () => {
                this.status.latency = Math.round(new Date() - start_time);
                // 0xFE packet identifier for a server list ping
                // 0x01 server list ping's payload (always 1)
                let data = Buffer.from([0xFE, 0x01])
                client.write(data);
            });

            // The client can also receive data from the server by reading from its socket.
            client.on('data', (response) => {
                // Check the readme for a simple explanation
                var server_info = response.toString().split("\x00\x00");

                this.status = {
                    host: this.host,
                    port: this.port,
                    status: true,
                    version: server_info[2].replace(/\u0000/g, ''),
                    motd: server_info[3].replace(/\u0000/g, ''),
                    current_players: server_info[4].replace(/\u0000/g, ''),
                    max_players: server_info[5].replace(/\u0000/g, ''),
                    latency: this.status.latency
                }
                formatMotd(server_info[3]);
                // Request an end to the connection after the data has been received.
                client.end();
                resolve(this.status);
            });

            client.on('end', () => {
                // console.log('Requested an end to the TCP connection');
            });

            client.on('error', (err) => {
                reject(err);
            });
        })
    }

    async asyncStatus() {
        let status = await this.getStatus();
        return status;
    }
}

function formatMotd(motd) {
    let noSpaces = motd.replace(/\u0000/g, '');
    Buffer.from(noSpaces);
    // let noColor = noSpaces.toString().replace(/[^\x00-\x7F]/g, '');
    // console.log(Buffer.from(motd, 'utf8').toString('hex'));
    // console.log(noColor);
}


function PingMCServer(ip, port, callback) {
    new MCServStatus(port, ip).getStatus().then((res) => {
        callback(res);
    }).catch(rej => {
        callback(null, rej);
    });
}

module.exports = {
    PingMCServer
};

// PROMISE VERSION
// new MCServStatus(25565, 'minecraft.frostiiz.com').getStatus().then((res) => {
//     console.log(res);
// }).catch(rej => {
//     console.log(rej)
// });

// Async function VERSION
// async function potato(port, ip) {
//     try {
//         //console.log(await new MCServStatus(25565, 'us.mineplex.com').asyncStatus());
//         console.log(await new MCServStatus(port, ip).asyncStatus());

//     } catch (err) {
//         console.log(err);
//     }
// }


/*
kick ff
two bytw big endian short 00 1f
utf-16be string 00 a7 00 31 00
mull char 00 00
protocol version: 31 00 32 00 37 00
null char 00 00
server version 31 00 2e 00 31 00 34 00 2e 00 33 00
null 00 00
motd 56 00 61 00 6e 00 69 00 6c 00 6c 00 61 00 20 00 31 00 2e 00 31 00 34 00
null char 00 00
current player count 31 00
null 00 00
max player 32 00 30
*/