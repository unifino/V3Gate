export type ARGv = {
    clear:        boolean,
    sort:         "usage"|"user"|"valid"|"activity",
    sc:           boolean,
    su:           boolean,
    sv:           boolean,
    sa:           boolean,
    all:          boolean,
    refresh:      "justDBs"|"Full",
    fullRefresh:  boolean,
    noRefresh:    boolean,
    update:       boolean,
    c:            boolean,
    s:            "usage"|"user"|"valid",
    a:            boolean,
    f:            "justDBs"|"Full",
    F:            boolean,
    x:            boolean,
    U:            boolean
}

export type CNX = {
    id: number
    user_id: number
    up: number
    down: number
    total: number
    remark: string
    enable: 0|1,
    expiry_time: number
    listen: string
    port: number
    protocol: 'vless'|'vmess'
    settings: {
        clients: [ {
            id: string,
            flow: "xtls-rprx-direct"
          } ],
        decryption: "none"
        fallbacks: []
    },
    stream_settings: {
        idk?: "Ich weiss nicht"
        network: "kcp"|"quic"|"ws"|"tcp"
        security: "none"|"xtls"|"tls"
        tlsSettings?: { serverName: string, certificates: object[] },
        xtlsSettings?: { serverName: string, certificates: object[] },
        tcpSettings: { header: { type: 'none' } }
        quicSettings: { security: 'none', key: '', header: { type: 'dtls' } }
        wsSettings?: { path: string, headers: object }
        kcpSettings?: {
          mtu: number
          tti: number
          uplinkCapacity: number
          downlinkCapacity: number
          congestion: boolean
          readBufferSize: number
          writeBufferSize: number
          header: {
            type: "none"
          },
          seed: string
        }
    },
    tag: string,
    sniffing: {
        enabled: boolean,
        destOverride: [ "http", "tls" ]
    }
}

export type Users = { [key: string]: CNX[] }

export type Table = {
    index?: number,
    Name: string,
    CNX: number,
    usage: number,
    Traffic: string,
    Spur?: number,
    DDC?: number,
    Valid: string,
    Days: number,
    active: boolean
}[]