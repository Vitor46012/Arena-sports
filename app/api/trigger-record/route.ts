import { NextRequest, NextResponse } from 'next/server';
import mqtt from 'mqtt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { courtId } = body;

    if (!courtId || typeof courtId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Parâmetro courtId é obrigatório.' },
        { status: 400 }
      );
    }

    // Normaliza courtId para o formato 'quadra-X' caso venha '1', '2' ou '3'
    let normalizedCourt = courtId.trim().toLowerCase();
    if (['1', '2', '3'].includes(normalizedCourt)) {
      normalizedCourt = `quadra-${normalizedCourt}`;
    }

    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883';
    const topic = `arena/web/botoeira/${normalizedCourt}`;
    const messagePayload = JSON.stringify({
      action: 'record',
      court: normalizedCourt,
      source: 'web',
    });

    // Publicação segura via MQTT com encerramento garantido da conexão para ambiente Serverless
    await new Promise<void>((resolve, reject) => {
      const clientId = `web_trigger_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`;
      const client = mqtt.connect(brokerUrl, {
        clientId,
        connectTimeout: 5000,
        reconnectPeriod: 0, // Evita reconexões infinitas no ciclo de vida serverless
      });

      let finished = false;

      const cleanup = (force = false) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        try {
          client.end(force);
        } catch {
          // Ignora erros ao fechar
        }
      };

      const timer = setTimeout(() => {
        cleanup(true);
        reject(new Error('Tempo limite excedido ao comunicar com o broker (5s).'));
      }, 5000);

      client.on('connect', () => {
        client.publish(topic, messagePayload, { qos: 1 }, (err) => {
          cleanup(false);
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      client.on('error', (err) => {
        cleanup(true);
        reject(err);
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Sinal de gravação enviado!',
      court: normalizedCourt,
      topic,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Falha ao processar comando de gravação.';
    console.error('[API_TRIGGER_RECORD] Erro:', errorMsg);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
