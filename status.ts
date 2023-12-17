module.exports = async function logStatusInf() {
    const mem: NodeJS.MemoryUsage = process.memoryUsage();
    const cpu:NodeJS.CpuUsage = process.cpuUsage();
    //console.log(`mem: ${(mem.heapUsed/1024**2).toFixed(2)}MB/${(mem.rss/1024**2).toFixed(2)}MB`);
    const inf = {
        timestamp: new Date().getTime(),
        memUsage: (mem.heapUsed/1024**2).toFixed(2) + 'MB',
        cpuUsage: (cpu.user/1024**2).toFixed(2) + '%'
    }
    console.log(JSON.stringify(inf));
}
