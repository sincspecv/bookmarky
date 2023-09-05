/**
 * Calculate the byte size of string
 *
 * @see https://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript#:~:text=4%2Dbytes%20long).-,Share,-Improve%20this%20answer
 * @param str string
 */
export const byteLength = (str : string) : number => {
    let s : number = str.length;
    for (let i : number = str.length - 1; i >= 0; i--) {
        let code : number = str.charCodeAt(i);
        if (code > 0x7f && code <= 0x7ff) s++;
        else if (code > 0x7ff && code <= 0xffff) s+=2;
        if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
    }
    return s;
}

export const strToChunks = (str : string, maxChunkSize : number) : Uint8Array[] => {
    // Encode the string
    const encoder = new TextEncoder();
    const columnsEnc = encoder.encode(str)
    const slices = Math.ceil(columnsEnc.length / maxChunkSize)
    let chunks = []


    // Split into chunks
    for(let i = 0; i < slices; i++) {
        const startPos = maxChunkSize * i
        const chunkData = new Uint8Array(columnsEnc.buffer.slice(startPos, startPos + (maxChunkSize)))
        chunks.push(chunkData)
    }

    return chunks
}

export const chunksToString = (chunks : Uint8Array[]) : string => {
    // Get the length
    let arrLength : number = 0
    chunks.forEach((chunk) => {
        arrLength += chunk.byteLength
    })

    // Combine into array
    let mergedArr = new Uint8Array(arrLength)
    let offset = 0
    chunks.forEach((chunk) => {
        mergedArr.set(chunk, offset)
        offset += chunk.byteLength
    })

    return new TextDecoder().decode(mergedArr)
}

export const timeOut = (ms : number) => {
    return new Promise(res => setTimeout(res, ms))
}
