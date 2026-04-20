export const createHttpError = (status, message, code = 'request_failed') => {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
};

export const asyncHandler = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        next(error);
    }
};
