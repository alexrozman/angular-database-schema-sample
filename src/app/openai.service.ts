// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Injectable } from "@angular/core";
import { DatabaseService, FunctionCall } from "./database.service";
import { functionDeclarations } from "./openai-function-declarations";
import OpenAI from "openai";
import { LogService } from "./log.service";

type ResponseType = "none" | "waiting" | "unknown" | "functionCalls" | "invalidFunctionCalls" | "text" | "error";

type Response = {
  type: ResponseType,
  response?: string,
};

@Injectable({
  providedIn: "root"
})
export class OpenAIService {

  constructor(
    private log: LogService,
    private database: DatabaseService,
  ) { }

  private modelVersion = '';
  private apiKey = '';
  private client?: OpenAI;

  systemInstruction = "";

  // Most recent response.
  public lastResponse: Response = { type: "none" };

  setSystemInstruction(systemInstruction: string) {
    this.systemInstruction = systemInstruction;
  }

  configure(modelVersion: string, apiKey: string) {
    this.modelVersion = modelVersion;
    this.apiKey = apiKey;
    this.client = new OpenAI({ apiKey });
  }

  async generateResponse(prompt: string) {
    if (!this.apiKey || !this.modelVersion) {
      this.lastResponse = {
        type: "error",
        response: 'You must specify a model name and valid API Key.',
      };
      return;
    }

    try {
      this.lastResponse = { type: "waiting" };

      const messages: any[] = [];
      if (this.systemInstruction) {
        messages.push({ role: 'system', content: this.systemInstruction });
      }

      prompt = prompt + "\nCurrent database schema:\n" +
        (this.database.tables.length ?
          JSON.stringify(this.database.tables)
          : "None, the database does not contain any table definitions.");
      this.log.info("Sending prompt:\n-----\n" + prompt + "\n-----");
      messages.push({ role: 'user', content: prompt });

      const result = await this.client!.chat.completions.create({
        model: this.modelVersion,
        messages,
        tools: functionDeclarations as any,
        tool_choice: 'auto',
      });

      const message = (result.choices && result.choices[0]?.message) as any;
      const calls = message?.tool_calls;
      if (calls) {
        this.log.info("Received", calls.length, "function calls.");
        const success = calls.every((call: any) => {
          const fc: FunctionCall = {
            name: call.function.name,
            args: JSON.parse(call.function.arguments || '{}'),
          };
          this.log.info("Received function call response:", fc);
          const err = this.database.callFunction(fc);
          if (err) {
            this.log.error("Error calling function: " + fc.name, err);
            return false;
          }
          this.log.info("Successfully called function " + fc.name);
          return true;
        });
        this.lastResponse = {
          type: success ? "functionCalls" : "invalidFunctionCalls",
          response: JSON.stringify(calls, null, 2),
        };
      } else if (message?.content) {
        this.log.info("Received text response:", message.content);
        this.lastResponse = {
          type: "text",
          response: message.content,
        };
      } else {
        this.lastResponse = {
          type: "unknown",
          response: JSON.stringify(result),
        };
      }
    } catch (e) {
      this.lastResponse = {
        type: "error",
        response: '' + e,
      }
      // Rethrow.
      throw e;
    }
  }
}
