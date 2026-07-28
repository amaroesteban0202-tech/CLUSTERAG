const CALL_LINK_PARAMS = ["callRoom", "callClient", "callMessage"];

const decodePathSegment = (value = "") => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

export const getCallRoomAlias = (roomId = "") => (
    String(roomId || "")
        .split("/")
        .pop()
        .replace(/[^a-zA-Z0-9._~-]/g, "-")
        .slice(0, 200)
);

export const resolveCallLink = (href, messages = []) => {
    let target;
    try {
        target = new URL(href);
    } catch {
        return null;
    }

    const queryRoomId = target.searchParams.get("callRoom") || "";
    const queryClientId = target.searchParams.get("callClient") || "";
    if (queryRoomId && queryClientId) {
        return {
            roomId: queryRoomId,
            clientId: queryClientId,
            messageId: target.searchParams.get("callMessage") || "",
            fromPath: false
        };
    }

    const roomAlias = getCallRoomAlias(
        decodePathSegment(target.pathname.split("/").filter(Boolean).pop() || "")
    );
    if (!roomAlias) return null;

    const endedRoomIds = new Set(
        messages
            .filter((message) => message.call?.ended && message.call?.roomId)
            .map((message) => getCallRoomAlias(message.call.roomId))
    );
    if (endedRoomIds.has(roomAlias)) return null;

    const message = [...messages].reverse().find(
        (item) => (
            getCallRoomAlias(item.call?.roomId) === roomAlias &&
            item.clientId &&
            !item.call?.ended
        )
    );
    if (!message) return null;

    return {
        roomId: message.call.roomId,
        clientId: String(message.clientId),
        messageId: String(message.id || ""),
        fromPath: true
    };
};

export const getConsumedCallLinkUrl = (href, fromPath = false) => {
    const target = new URL(href);
    CALL_LINK_PARAMS.forEach((param) => target.searchParams.delete(param));
    if (fromPath) target.pathname = "/";
    return target.toString();
};
