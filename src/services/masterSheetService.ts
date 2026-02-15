import { PhaseModel } from "../models/Phase.js";
import { QuestionModel } from "../models/Question.js";
import { GroupSheetModel } from "../models/GroupSheet.js";
import { QuestionGroupMappingModel } from "../models/QuestionGroupMapping.js";
import { writeQuestionHeaderToSheet, readRange } from "./googleSheets.js";
import { nextQuestionColumnPair, columnToNumber, numberToColumn } from "./columnUtils.js";

export interface AddQuestionToSheetParams {
    phaseId: string;
    platform: "leetcode" | "codeforces" | "hackerrank" | "atcoder" | "geeksforgeeks";
    questionKey: string;
    title: string;
    url: string;
    difficulty: "Easy" | "Medium" | "Hard";
    tags: string[];
}

export interface AddQuestionToSheetResult {
    questionId: string;
    masterColumn: string;
    timeColumn: string;
    mappingsCreated: number;
    sheetUpdated: boolean;
}

/**
 * Add a question to the Master Sheet with full formatting and auto-create
 * QuestionGroupMappings for all active groups.
 */
export async function addQuestionToMasterSheet(
    params: AddQuestionToSheetParams
): Promise<AddQuestionToSheetResult> {
    const { phaseId, platform, questionKey, title, url, difficulty, tags } = params;

    // 1. Load Phase
    const phase = await PhaseModel.findById(phaseId);
    if (!phase) {
        throw new Error("Phase not found");
    }

    // 2. Calculate next column pair
    let { questionColumn, timeColumn } = nextQuestionColumnPair(
        phase.lastQuestionColumn as string | null,
        phase.startColumn as string
    );

    // 3. Safety: verify the target column is empty by reading row 5
    try {
        const tabPrefix = `'${phase.tabName}'!`;
        const checkRange = `${tabPrefix}${questionColumn}5`;
        const existing = await readRange(phase.masterSheetId as string, checkRange);
        const cellValue = existing?.[0]?.[0]?.toString().trim();

        if (cellValue) {
            // Column is occupied — scan rightward to find an empty pair
            let currentNum = columnToNumber(questionColumn);
            let found = false;

            for (let attempt = 0; attempt < 50; attempt++) {
                currentNum += 2;
                const nextQ = numberToColumn(currentNum);
                const nextCheckRange = `${tabPrefix}${nextQ}5`;
                const nextExisting = await readRange(phase.masterSheetId as string, nextCheckRange);
                const nextValue = nextExisting?.[0]?.[0]?.toString().trim();

                if (!nextValue) {
                    questionColumn = nextQ;
                    timeColumn = numberToColumn(currentNum + 1);
                    found = true;
                    break;
                }
            }

            if (!found) {
                throw new Error("Could not find an empty column pair after 50 attempts");
            }
        }
    } catch (error: any) {
        // If the error is about the range not being found, that's fine — the column is empty
        if (error.message?.includes("Could not find")) {
            throw error;
        }
        // Otherwise proceed (empty cells may throw in some edge cases)
    }

    // 4. Write header data & formatting to Master Sheet
    await writeQuestionHeaderToSheet({
        sheetId: phase.masterSheetId as string,
        tabName: phase.tabName as string,
        questionColumn,
        timeColumn,
        title,
        difficulty,
        platform,
        tags,
        url
    });

    // 5. Create Question in MongoDB
    const question = await QuestionModel.create({
        platform,
        questionKey,
        title,
        url,
        difficulty,
        tags,
        phaseId: phase._id,
        masterColumn: questionColumn,
        timeColumn
    });

    // 6. Update Phase.lastQuestionColumn
    phase.lastQuestionColumn = questionColumn;
    await phase.save();

    // 7. Auto-create QuestionGroupMapping for all active groups
    const activeGroups = await GroupSheetModel.find({ active: true });
    let mappingsCreated = 0;

    for (const group of activeGroups) {
        try {
            await QuestionGroupMappingModel.create({
                questionId: question._id,
                groupId: group._id,
                trialColumn: questionColumn,
                timeColumn
            });
            mappingsCreated += 1;
        } catch (error: any) {
            // Skip if mapping already exists (duplicate key)
            if (error?.code !== 11000) {
                throw error;
            }
        }
    }

    return {
        questionId: question.id,
        masterColumn: questionColumn,
        timeColumn,
        mappingsCreated,
        sheetUpdated: true
    };
}

/**
 * Preview what column the next question would occupy.
 */
export async function getNextAvailableColumn(phaseId: string): Promise<{
    nextQuestionCol: string;
    nextTimeCol: string;
}> {
    const phase = await PhaseModel.findById(phaseId);
    if (!phase) {
        throw new Error("Phase not found");
    }

    const { questionColumn, timeColumn } = nextQuestionColumnPair(
        phase.lastQuestionColumn as string | null,
        phase.startColumn as string
    );

    return {
        nextQuestionCol: questionColumn,
        nextTimeCol: timeColumn
    };
}
