import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function extractGitLogs(repoPath: string, author: string, months: number = 6, lastAnalysedAt?: Date | null): Promise<string> {
  // Command options:
  // --author: Filters by author name or email
  // --since: Gets commits within the last X months or exact date
  // --no-merges: Ignores merge commits which can be noisy
  // --stat: Shows file changes summary
  // --patch (or -p): Shows the actual diffs
  
  if (lastAnalysedAt) {
    const isoDate = lastAnalysedAt.toISOString();
    console.log(`[Git] Delta Sync triggered! Fetching ONLY what changed since ${isoDate}`);
    const cmd = `git log --author="${author}" --since="${isoDate}" --no-merges --stat -p`;
    
    try {
      const { stdout, stderr } = await execAsync(cmd, { cwd: repoPath, maxBuffer: 1024 * 1024 * 20 });
      return stdout;
    } catch (e) {
      console.warn("Error doing delta git log:", e);
      return "";
    }
  }

  // To avoid gigabytes of text, we will limit the number of logs or rely on the LLM to digest smaller chunks.
  // We'll use a relatively comprehensive log format.
  const timeSpans = [6, 12, 18, 24];
  let finalStdout = "";
  
  for (const m of timeSpans) {
    const cmd = `git log --author="${author}" --since="${m} months ago" --no-merges --stat -p`;
    
    try {
      const { stdout, stderr } = await execAsync(cmd, { cwd: repoPath, maxBuffer: 1024 * 1024 * 20 }); 
      
      if (stderr) {
        console.warn(`Git log stderr (${m}m):`, stderr);
      }
      
      if (stdout && stdout.trim().length > 0) {
        console.log(`[Git] Found commits looking back ${m} months.`);
        finalStdout = stdout;
        break; 
      }
    } catch (error) {
      console.error(`Error executing git command for ${m} months:`, error);
      throw error;
    }
  }

  return finalStdout;
}
