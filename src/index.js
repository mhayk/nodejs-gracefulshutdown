import { createServer } from 'node:http'

import { once } from 'node:events'

async function handler(request, response) {
    try {
        const data = JSON.parse(await once(request, 'data'))
        console.log('\nreceived data:', data)
        response.writeHead(200)
        response.end(JSON.stringify(data))

        setTimeout(() => {
            throw new Error('will be handled on uncaught')
        }, 1000)

        Promise.reject('will be handled on unhandledRejection')
        // await Promise.reject('will be handled on unhandledRejection')
    } catch (error) {
        console.error("TRAGIC ERROR", error.stack)
        response.writeHead(500)
        response.end()
    }
}

const server = createServer(handler)
    .listen(3000)
    .on('listening', () => console.log('Listening on port 3000'))

// catch errors that were not handled ( different scopes)
// it is missing the event below, the system breaks
process.on('uncaughtException', (error, origin) => {
    console.log(`\n${origin} signal received. \n${error}`)
})

// it is missing the event below, the system shows a warning
process.on('unhandledRejection', (error) => {
    console.log(`\nunhandledRejection signal received. \n${error}`)
})

// ---- graceful shutdown
function gracefulShutdown(event) {
    return (code) => {
        console.log(`${event} received with ${code}`)

        // We guarantee that no customer will enter this application in the
        // period, but whoever is in a transaction, finishes what they are doing.
        server.close(() => {
            console.log('\nHTTP Server closed')
            console.log('DB connection closed')
            process.exit(code)
        })

    }
}

// dispatched by CTRL+C on the terminal -> multiplatform
process.on('SIGINT', gracefulShutdown('SIGINT'))

// dispatched by signal kill
process.on('SIGTERM', gracefulShutdown('SIGTERM'))

process.on('exit', (code) => {
    console.log('exit signal received', code)
})