const express = require('express')
const winston = require('winston')
const amqp = require('amqplib')

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logfile_m1.log' })
    ]
});

const app = express()

const rabbitMQUrl = 'amqp://localhost'

app.use(express.json())


app.post('/process',async (req,res) =>{

    const message = req.body

    const connect = await amqp.connect(rabbitMQUrl)
    const chanel = await connect.createChannel()

    const tempQueue = await chanel.assertQueue('',{exclusive: true})

    console.log(tempQueue.queue)
    chanel.sendToQueue('testQu',Buffer.from(JSON.stringify({ task: message, replyTo: tempQueue.queue })))

    //res.status(200).send('node')

    await chanel.consume(tempQueue.queue, async (mesa) => {

        const result = JSON.parse((mesa.content.toString()))
        res.status(200).json(result)

        logger.info(`Пришел ответ с результатом ${result}`);
        //res.status(200).send('node')
        await chanel.close()
        await connect.close()
    }, {noAck: true})

})


app.listen(3000,() => {
    console.log('Server start. port 3000')
})