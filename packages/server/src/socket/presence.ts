export class PresenceRegistry {
  private readonly socketsByPlayer = new Map<string, Set<string>>()

  connect(playerId: string, socketId: string): number {
    const sockets = this.socketsByPlayer.get(playerId) ?? new Set<string>()
    sockets.add(socketId)
    this.socketsByPlayer.set(playerId, sockets)
    return sockets.size
  }

  disconnect(playerId: string, socketId: string): number {
    const sockets = this.socketsByPlayer.get(playerId)
    if (!sockets) return 0

    sockets.delete(socketId)
    if (sockets.size === 0) this.socketsByPlayer.delete(playerId)
    return sockets.size
  }

  count(playerId: string): number {
    return this.socketsByPlayer.get(playerId)?.size ?? 0
  }
}
