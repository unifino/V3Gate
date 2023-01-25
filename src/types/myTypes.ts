export type ARGv = {
    clear:        boolean,
    sort:         "usage"|"user"|"valid"|"activity",
    all:          boolean,
    refresh:      "justDBs"|"Full",
    fullRefresh:  boolean,
    noRefresh:    boolean,
    c:            boolean,
    s:            "usage"|"user"|"valid",
    a:            boolean,
    f:            "justDBs"|"Full"
    F:            boolean,
    x:            boolean
}

export type CNX = {
    id: number,
    user_id: number,
    up: number,
    down: number,
    total: number,
    remark: string,
    enable: 0|1,
    expiry_time: number,
    listen: string,
    port: number,
    protocol: 'vless'|'vmess',
    settings: { 
        clients: [ {
            id: string,
            flow: "xtls-rprx-direct" 
          }],
        decryption: "none",
        fallbacks: [] 
    },
    stream_settings: {
        network: "kcp",
        security: "none",
        kcpSettings: {
          mtu: number,
          tti: number,
          uplinkCapacity: number,
          downlinkCapacity: number,
          congestion: boolean,
          readBufferSize: number,
          writeBufferSize: number,
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
    Diff?: number,
    Valid: string,
    Days: number
}[]